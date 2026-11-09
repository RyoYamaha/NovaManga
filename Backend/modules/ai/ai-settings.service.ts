import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_AI_DAILY_LIMIT, DEFAULT_AI_SYSTEM_PROMPT, AI_SETTING_KEYS } from './ai.constants';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

export interface AiSettings {
  enabled: boolean;
  dailyLimit: number;
  systemPrompt: string;
}

@Injectable()
export class AiSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<AiSettings> {
    // BƯỚC 1: Lấy các dòng cài đặt AI từ bảng SystemSetting.
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: Object.values(AI_SETTING_KEYS) } },
      select: { key: true, value: true },
    });

    // BƯỚC 2: Tạo bảng tra cứu nhanh theo tên key, ví dụ AI_DAILY_LIMIT -> "20".
    const values = new Map(settings.map(({ key, value }) => [key, value]));

    // BƯỚC 3: Chuyển hạn mức từ chuỗi trong database thành số.
    const parsedLimit = Number(values.get(AI_SETTING_KEYS.dailyLimit));

    // BƯỚC 4: Trả cấu hình; dùng giá trị mặc định nếu database chưa có hoặc dữ liệu không hợp lệ.
    return {
      enabled: values.has(AI_SETTING_KEYS.enabled)
        ? values.get(AI_SETTING_KEYS.enabled) === 'true'
        : true,
      dailyLimit: Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : DEFAULT_AI_DAILY_LIMIT,
      systemPrompt: values.get(AI_SETTING_KEYS.systemPrompt) || DEFAULT_AI_SYSTEM_PROMPT,
    };
  }

  async updateSettings(dto: UpdateAiSettingsDto, actorId: string) {
    // BƯỚC 1: Đọc cấu hình hiện tại để giữ nguyên những mục không được gửi lên cập nhật.
    const current = await this.getSettings();

    // BƯỚC 2: Ghép giá trị mới với giá trị cũ; loại bỏ khoảng trắng ở systemPrompt.
    const updated: AiSettings = {
      // . Nếu người dùng không gửi giá trị mới 
      // cho thuộc tính nào thì giữ nguyên giá trị cũ (current).
      enabled: dto.enabled ?? current.enabled,
      dailyLimit: dto.dailyLimit ?? current.dailyLimit,
      systemPrompt: dto.systemPrompt?.trim() ?? current.systemPrompt,
    };

    // BƯỚC 3: Không cho lưu prompt rỗng.
    if (!updated.systemPrompt) {
      throw new BadRequestException('Chỉ dẫn hệ thống không được để trống');
    }

    // BƯỚC 4: Chỉ chuẩn bị các mục thực sự có mặt trong yêu cầu cập nhật.
    const changes: Array<{ key: string; value: string }> = [];
    if (dto.enabled !== undefined) {
      changes.push({ key: AI_SETTING_KEYS.enabled, value: String(updated.enabled) });
    }
    if (dto.dailyLimit !== undefined) {
      changes.push({ key: AI_SETTING_KEYS.dailyLimit, value: String(updated.dailyLimit) });
    }
    if (dto.systemPrompt !== undefined) {
      changes.push({ key: AI_SETTING_KEYS.systemPrompt, value: updated.systemPrompt });
    }

    // BƯỚC 5: Lưu cấu hình và ghi nhật ký quản trị trong cùng một transaction.
    await this.prisma.$transaction(async (transaction) => {
      // Thêm mới key chưa có hoặc cập nhật giá trị của key đã tồn tại.
      for (const setting of changes) {
        await transaction.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting,
        });
      }

      // Ghi lại ai thay đổi, những key nào đổi và cấu hình trước/sau.
      await transaction.aiAdminAuditLog.create({
        data: {
          actorId,
          action: 'UpdateAiSettings',
          details: JSON.stringify({
            changedKeys: changes.map(({ key }) => key),
            before: current,
            after: updated,
          }),
        },
      });
    });

    // BƯỚC 6: Trả cấu hình sau khi cập nhật thành công.
    return {
      enabled: updated.enabled,
      dailyLimit: updated.dailyLimit,
      systemPrompt: updated.systemPrompt,
    };
  }

  async getUsageStats() {
    // BƯỚC 1: Đếm tổng yêu cầu, yêu cầu lỗi, tổng token và chi phí cùng lúc.
    const [total, errors, tokens, cost] = await Promise.all([
      this.prisma.aiUsageEvent.count(),
      this.prisma.aiUsageEvent.count({ where: { status: 'Error' } }),
      this.prisma.aiUsageEvent.aggregate({
        _sum: { promptTokens: true, completionTokens: true },
      }),
      this.prisma.aiUsageEvent.aggregate({ _sum: { estimatedCostUsd: true } }),
    ]);

    // BƯỚC 2: Trả số liệu thống kê; nếu chưa có token nào thì dùng 0.
    return {
      totalRequests: total,
      failedRequests: errors,
      promptTokens: tokens._sum.promptTokens ?? 0,
      completionTokens: tokens._sum.completionTokens ?? 0,
      estimatedCostUsd: cost._sum.estimatedCostUsd,
    };
  }

  async listAiUsers(search?: string) {
    // Lấy tối đa 100 người dùng không phải Admin, sắp xếp theo tên đăng nhập.
    // Nếu có từ khóa, tìm trong username hoặc email.
    return this.prisma.user.findMany({
      where: {
        role: { not: 'Admin' }, //luôn loại tài khoản admin khỏi kết quả
        ...(search //nếu có từ khóa tham số search
          ? {
              OR: [ //có 1 trong 2 
                { username: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        aiBlocked: true,
      },
      orderBy: { username: 'asc' },
      take: 100,
    });
  }

  async setUserAiBlocked(userId: string, blocked: boolean, actorId: string) {
    // BƯỚC 1: Không cho Admin tự khóa quyền AI của chính mình.
    if (userId === actorId) {
      throw new BadRequestException('Không thể tự khóa AI của tài khoản Admin');
    }

    // BƯỚC 2: Tìm người dùng và chỉ cho phép quản lý tài khoản không phải Admin.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user || user.role === 'Admin') {
      throw new NotFoundException('Không tìm thấy người dùng có thể quản lý AI');
    }

    // BƯỚC 3: Cập nhật quyền AI và ghi nhật ký trong cùng một transaction.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { aiBlocked: blocked },
      }),
      this.prisma.aiAdminAuditLog.create({
        data: {
          actorId,
          action: blocked ? 'BlockUserAi' : 'UnblockUserAi',
          details: JSON.stringify({ userId }),
        },
      }),
    ]);

    // BƯỚC 4: Trả trạng thái quyền AI mới của người dùng.
    return { userId, aiBlocked: blocked };
  }
}
