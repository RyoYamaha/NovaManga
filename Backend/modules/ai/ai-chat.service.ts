import {BadRequestException,ForbiddenException,HttpException,HttpStatus,Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiProviderService } from './ai-provider.service';
import { AiSettingsService } from './ai-settings.service';
import { MAX_AI_MESSAGE_LENGTH } from './ai.constants';
import { SendAiMessageDto } from './dto/send-ai-message.dto';
import { communityTranslationVisibilityWhere } from '../content/content/content-visibility';

@Injectable()
export class AiChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: AiProviderService, //giao tiếp với nhà cung cấp AI 
    private readonly settingsService: AiSettingsService, //lấy cài đặt Ai 
  ) {}


  //getStatus() trong AiChatService có trách nhiệm kiểm tra và tổng hợp 
  //trạng thái sử dụng AI của một người dùng, sau đó trả thông tin đó về cho frontend.

  async getStatus(userId: string) {
    //sử dụng hàm bất đồng bộ , chờ nhiều tác vụ hoàn thành và gán kết quả vào các biến
    const [user, settings, usage] = await Promise.all([

      this.prisma.user.findUnique({ where: { id: userId }, select: { isLocked: true, aiBlocked: true },}),
      //lấy trạng thái khóa tài khoản và trạng thái chặn Ai của người dùng 

      //lấy cài đặt Ai
      this.settingsService.getSettings(), //vd: Ai có đang bật và giới hạn là bao nhiêu 
      
      //lấy lượt sử dụng 
      this.getDailyUsage(userId), //lấy lượt Ai đã sử dụng hôm nay 
    ]);

    return {
       //Cho frontend biết trạng thái AI toàn hệ thống
      enabled: settings.enabled,
      //Cho frontend biết người dùng có đủ điều kiện sử dụng AI không
      available: settings.enabled && !!user && !user.isLocked && !user.aiBlocked, 
      //available sẽ true nếu tất cả các điều kiện trong nó true 

      //Dòng này cho biết người dùng có bị chặn sử dụng AI hay không.
      blocked: user?.aiBlocked ?? false,
      //limit trong 1 ngày 
      limitReached: usage >= settings.dailyLimit,
    };
  }
// lấy danh sách các phiên sử dụng Ai của người dùng 
  async listSessions(userId: string) {
    return this.prisma.aiChatSession.findMany({
      where: { userId },
      select: {
        id: true,
        novelId: true,
        createdAt: true,
        updatedAt: true,
        novel: { select: { title: true } },
        messages: {
          select: { content: true, role: true, createdAt: true }, 
          //content: nội dung tin nhắn , role của người dùng , thời điểm tạo tin nhắn 
          orderBy: { createdAt: 'desc' }, //sắp xếp theo giảm dần
          take: 1, //chỉ lấy 1 tin nhắn duy nhất, (tức ở đây lấy cái được tạo ở cuối cùng (gần đây nhất))
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, //lấy tối đa 50 phiên 
    });
  }


  //lấy một phiên trò chuyện và toàn bộ lịch sử tin nhắn của phiên đó.
  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId }, //id của người dùng và id của phiên trò truyện muốn xem 
      select: {
        id: true,
        novelId: true,
        createdAt: true,
        updatedAt: true,
        novel: { select: { title: true } },
        messages: {
          select: { id: true, role: true, content: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên trò chuyện');
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.aiChatSession.findFirst({ where: { id: sessionId, userId }, select: { id: true },});
    if (!session) throw new NotFoundException('Không tìm thấy phiên trò chuyện');

    await this.prisma.$transaction([
      this.prisma.aiChatMessage.deleteMany({ where: { sessionId } }), //xóa các tin nhắn 
      this.prisma.aiChatSession.delete({ where: { id: sessionId } }), //xóa đoạn chat
    ]);
    return { deleted: true };
  }

  //xử lý gần như toàn bộ quy trình khi người dùng gửi câu hỏi cho trợ lý AI
  //+ kiểm tra câu hỏi, 
  //+ kiểm tra quyền sử dụng, 
  //+ tạo hoặc tìm phiên trò chuyện, 
  //+ lấy lịch sử hội thoại, 
  //+gọi AI tạo câu trả lời 
  //+lưu kết quả vào database.
  async sendMessage(userId: string, dto: SendAiMessageDto) {

    //BƯỚC 1: KIỂM TRA CÂU HỎI 
    //trim khoảng trắng và giới hạn độ dài 
    const message = dto.message.trim();
    if (!message || message.length > MAX_AI_MESSAGE_LENGTH) {
      throw new BadRequestException('Câu hỏi không hợp lệ hoặc vượt quá giới hạn độ dài');
    }

    //BƯỚC 2 KIỂM TRA CÀI ĐẶT AI VÀ TÀI KHOẢN NGƯỜI DÙNG 

    const [settings, user] = await Promise.all([
      this.settingsService.getSettings(),
      this.prisma.user.findUnique({ where: { id: userId },select: { isLocked: true, aiBlocked: true },}),
    ]);
    if (!settings.enabled) throw new ForbiddenException('Trợ lý AI hiện đang tắt');
    if (!user || user.isLocked || user.aiBlocked) {
      throw new ForbiddenException('Tài khoản hiện không được phép sử dụng AI');
    }

    //BƯỚC 3: KIỂM TRA PHIÊN TRÒ CHUYỆN HIỆN TẠI
    const session = dto.sessionId
      ? await this.prisma.aiChatSession.findFirst({ where: { id: dto.sessionId, userId }, 
        select: { id: true, novelId: true },})
      : null;

    if (dto.sessionId && !session) {
      throw new NotFoundException('Không tìm thấy phiên trò chuyện');
    }
    if (session && dto.novelId && session.novelId !== dto.novelId) {
      throw new ForbiddenException('Không thể đổi Novel trong phiên trò chuyện hiện tại');
    }


    //BƯỚC 4: XÁC ĐỊNH NOVEL MÀ AI SẼ SỬI DỤNG 
    let novelId = null;
      //ưu tiên lấy session từ novel đã tồn tại 
      if (session && session.novelId !== null && session.novelId !== undefined) {novelId = session.novelId;} 
      //không thì lấy từ người dùng gửi lên 
      else if (dto.novelId !== null && dto.novelId !== undefined) { novelId = dto.novelId;} 

      else {novelId = null;}
    
    if (novelId) {
      const novel = await this.prisma.content.findFirst({
        where: {
          id: novelId,
          type: 'Novel',
          publicationStatus: 'Published',
          AND: [communityTranslationVisibilityWhere()],
        },
        select: { id: true },
      });
      if (!novel) throw new NotFoundException('Không tìm thấy Novel khả dụng');
    }

    //BƯỚC 5 ĐĂNG KÝ LƯỢT SỬ DỤNG AI VÀ KHAI BÁO PHIÊN CHAT 


    const usageEventId = await this.reserveDailyUsage(userId, settings.dailyLimit);
    //settings.dailyLimit: giới hạn số lượt sử dụng AI mỗi ngày.
    // usageEventId: lưu ID của bản ghi lượt sử dụng để cập nhật trạng thái sau này.


    //BƯỚC 5.5 KIỂM TRA XEM CÒN PHIÊN CHAT CŨ KHÔNG , KHÔNG THÌ TẠO CÁI MỚI 
    
    //biến dùng để lưu phiên chat sẽ được xử lý trong tin nhắn hiện tại 
    let activeSession: { id: string; novelId: string | null } | null = null;

    try {
      //nếu phiên chat cũ thì dùng phiên chat cũ
        if (session) {
          activeSession = session;
        //nếu chưa có phiên chat cũ thì tạo mới phiên chat
        } else {
          activeSession = await this.prisma.aiChatSession.create({ data: { userId: userId, novelId: novelId,},
            select: { id: true, novelId: true,},
          });
        }

      //tạo message của người dùng cho phiên chat đấy 
      await this.prisma.aiChatMessage.create({ data: { sessionId: activeSession.id, role: 'user', content: message },});

    //BƯỚC 6: LẤY LỊCH SỬ PHIÊN CHAT , trợ lý chat cần nhớ vài lượt trước để hiểu câu 
    //hỏi tiếp theo 
    
        //lấy phiên chat , giới hạn 11 cái phiên chat
      const historyRows = await this.prisma.aiChatMessage.findMany({
        where: { sessionId: activeSession.id },
        select: { role: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 11,
      });

      //đảo thứ tự ,bỏ câu hỏi hiện tại và chuyển đổi dữ liệu 
      const history = historyRows.reverse().slice(0, -1).map((row) => ({
        role: row.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: row.content,
      }));

      //BƯỚC 7: GỌI AI ĐỂ TẠO CÂU TRẢ LỜI VÀ LƯU CÂU TRẢ LỜI VÀO DATABASE
      const generated = await this.provider.generateAnswer( message, history, settings, activeSession.novelId,);

      //lưu câu trả lời của Ai 
      const answer = await this.prisma.aiChatMessage.create({
        data: {
          sessionId: activeSession.id,
          role: 'assistant',
          content: generated.answer,
        },
        select: { id: true, role: true, content: true, createdAt: true },
      });

      //BƯỚC 8: CẬP NHẬT THÔNG TIN SAU KHI AI TRẢ LỜI THÀNH CÔNG 

      await this.prisma.$transaction([
        //cập nhật lại thời gian phiên chat 
        this.prisma.aiChatSession.update({
          where: { id: activeSession.id },
          data: { updatedAt: new Date() },
        }),
        //cập nhật lượt sử dụng Ai 
        this.prisma.aiUsageEvent.update({
          where: { id: usageEventId },
          data: {
            sessionId: activeSession.id,
            status: 'Success',
            promptTokens: generated.promptTokens, //lưu token đầu vào do ai provider báo cáo 
            completionTokens: generated.completionTokens, //lưu token đầu ra 
          },
        }),
      ]);

      return {
        sessionId: activeSession.id,
        answer,
      };

    } catch (error) {
      if (!session && activeSession) {
        await this.prisma.$transaction([
          this.prisma.aiChatMessage.deleteMany({
            where: { sessionId: activeSession.id },
          }),
          this.prisma.aiChatSession.delete({ where: { id: activeSession.id } }),
        ]);
      }
      await this.prisma.aiUsageEvent.update({
        where: { id: usageEventId },
        data: {
          sessionId: activeSession?.id,
          status: 'Error',
          errorCode: error instanceof Error ? error.name : 'UnknownError',
        },
      });
      throw error;
    }
  }

//Hàm getDailyUsage() có nhiệm vụ lấy số lượt sử dụng AI của một người dùng trong ngày hiện tại
  private async getDailyUsage(userId: string): Promise<number> {

    //TÌM SỐ LƯỢT AI SỬ DỤNG 1 NGÀY CỦA 1 NGƯỜI 
    const usage = await this.prisma.aiUsageDaily.findUnique({
      where: { userId_date: { userId, date: this.getUtcDate() } },
      select: { count: true },
    });
    return usage?.count ?? 0;
  }


 //Hàm reserveDailyUsage() thực hiện 3 nhiệm vụ chính:
  //1. Kiểm tra giới hạn: Lấy số lượt người dùng đã sử dụng trong ngày và so sánh với limit.
  // 2. Tăng lượt sử dụng: Nếu chưa vượt giới hạn, tăng count lên 1 để giữ trước một lượt cho message sắp gửi đến AI.
  // 3. Tạo bản ghi theo dõi: Tạo một AiUsageEvent có trạng thái Processing và trả về ID để cập nhật kết quả sau này.
  private async reserveDailyUsage(userId: string, limit: number): Promise<string> {
      //limit: số lượt hỏi Ai tối đa trong ngày
      //Promise<string>: Khi chạy xong, hàm trả về một chuỗi, cụ thể là ID của bản ghi AiUsageEvent.

    const date = this.getUtcDate();
    

    //BƯỚC 1: ĐẢM BẢO CÓ BẢN GHI THỐNG KÊ LƯỢT DÙNG 
    await this.prisma.aiUsageDaily.upsert({
      where: { userId_date: { userId, date } },
      update: {},
      create: { userId, date, count: 0 },
    });

    //BƯỚC 2: KIỂM TRA LƯỢT DÙNG GIỚI HẠN 
    const usage = await this.getDailyUsage(userId);
    if (usage >= limit) {
      throw new HttpException(
        'Bạn đã sử dụng hết lượt hỏi AI trong ngày',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    //BƯỚC 3: NẾU BẢN GHI CHƯA VƯỢT GIỚI HẠN THÌ TĂNG LÊN 1 LẦN SỬ DỤNG 
    const [, event] = await this.prisma.$transaction([
      this.prisma.aiUsageDaily.update({
        where: { userId_date: { userId, date } },
        data: { count: { increment: 1 } },
      }),
      //CHUYỂN SANG TRẠNG THÁI ĐANG XỬ LÝ 
      this.prisma.aiUsageEvent.create({
        data: { userId, status: 'Processing' },
        select: { id: true },
      }),
    ]);
    return event.id;
  }

  private getUtcDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

}
