import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateBankSettingsDto } from './dto/update-bank-settings.dto';
import { isUniqueConstraintError } from './payment-errors';
import { PaymentAdminQueryService } from './payment-admin-query.service';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { SepayWebhookService } from './sepay-webhook.service';

const BANK_SETTING_KEYS = {
  bankName: 'payment.bankName',
  bankBin: 'payment.bankBin',
  bankAccountNumber: 'payment.bankAccountNumber',
  bankAccountName: 'payment.bankAccountName',
} as const;

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentAdminQueryService: PaymentAdminQueryService,
    private readonly paymentReconciliationService: PaymentReconciliationService,
    private readonly sepayWebhookService: SepayWebhookService,
  ) {}




  ///////////////////1. NGƯỜI DÙNG DÙNG TẠO ĐƠN NẠP TIỀN/////////////////////////////
  async createDeposit(userId: string, dto: CreateDepositDto) {

    //BƯỚC 1: KIỂM TRA THÔNG TIN NGÂN HÀNG NHẬN TIỀN ĐÃ ĐƯỢC CẤU HÌNH

    const settings = await this.readBankSettings();
    //gọi hàm readBankSetting để kiểm tra xem thông tin nhận tiền đã đầy đủ

    //nếu biến setting không tồn tại -> chạy hàm if từ chối
    if (!settings) {
      throw new ServiceUnavailableException(
        'Thông tin tài khoản nhận tiền chưa được cấu hình',
      );
    }
    //BƯỚC 2: TẠO MÃ QR VÀ LƯU THÔNG TIN THANH TOÁN VÀO TRONG DB


    for (let attempt = 0; attempt < 3; attempt += 1) {
    //Để attemp bằng 0, tăng 1 lần mỗi vòng, miễn là nhỏ hơn 3
    //cần chạy 3 lần để đảm bảo là mã không bị trùng


      const transferCode = `NM${randomBytes(4).toString('hex').toUpperCase()}`;
      //tạo mã chuyển khoản


      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); //mỗi 30 phút có 60 giây ,mỗi giây có 1000 mili giây
      //tạo thời hạn cho đơn nạp tiền


      // tạo bản ghi trong database
      //+ thông tin số tiền của người dùng và thông tin của người được nhận
      try {
        const order = await this.prisma.paymentOrder.create({
          data: {
            userId,
            expectedAmount: dto.amountVnd,
            transferCode,
            bankBin: settings.bankBin,
            bankName: settings.bankName,
            bankAccountNumber: settings.bankAccountNumber,
            bankAccountName: settings.bankAccountName,
            expiresAt,
          },
        });

        //trả dữ liệu cho frontend

        return {
          id: order.id,
          expectedAmount: order.expectedAmount,
          expectedCoins: order.expectedAmount / 1000,
          status: order.status,
          transferCode: order.transferCode,
          bankName: order.bankName,
          bankAccountNumber: order.bankAccountNumber,
          bankAccountName: order.bankAccountName,
          qrUrl: this.createQrUrl(order),
          expiresAt: order.expiresAt,
        };
      } catch (error) {

        //kiểm tra xem bị trùng ở các phần unique không , nếu bị trùng thì đổi sang lần 2
        if (!isUniqueConstraintError(error) || attempt === 2) {
          throw error;
        }
      }
    }

    throw new ConflictException('Không thể tạo mã chuyển khoản duy nhất');
  }




  //////////////////2. LẤY THÔNG TIN THANH TOÁN////////////////////////
  async getPaymentOrder(userId: string, paymentOrderId: string) {
    const order = await this.prisma.paymentOrder.findFirst({
      where: { id: paymentOrderId, userId },
      select: {
        id: true,
        expectedAmount: true,
        paidAmount: true,
        paidCoins: true,
        status: true,
        transferCode: true,
        bankBin: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        expiresAt: true,
        paidAt: true,
        createdAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy yêu cầu nạp tiền');
    }

    return {
      ...order,
      qrUrl: this.createQrUrl(order),
      isExpired:
        order.status === 'Pending' && order.expiresAt.getTime() < Date.now(),
    };
  }


  //////////////////3. LẤY THÔNG TIN TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN////////////////////////
  async getBankSettings() {
    const settings = await this.readBankSettings();
    return {
      configured: settings !== null,
      bankName: settings?.bankName ?? null,
      bankBin: settings?.bankBin ?? null,
      bankAccountNumber: settings?.bankAccountNumber ?? null,
      bankAccountName: settings?.bankAccountName ?? null,
    };
  }



  ////////////////4. SỬA LẠI THÔNG TIN TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN//////////////////////////
  async updateBankSettings(dto: UpdateBankSettingsDto) {

    //BƯỚC 1: TẠO 1 MẢNG LƯU CÁC CẶP GIÁ TRỊ

    //mảng entries gán từng giá trị trong dto vào trong BANK_SETTING_KEYS
    //mục đích: gom 4 cặp khóa giá trị thành 1 mảng để có thể xử lý bằng vòng lặp
    //vd bankname key có value là dto.bankname
    const entries = [
      [BANK_SETTING_KEYS.bankName, dto.bankName],
      [BANK_SETTING_KEYS.bankBin, dto.bankBin],
      [BANK_SETTING_KEYS.bankAccountNumber, dto.bankAccountNumber],
      [BANK_SETTING_KEYS.bankAccountName, dto.bankAccountName],
    ] as const;


    ///////////////////BƯỚC 2: DUYỆT QUA CÁC CẶP GIÁ TRỊ ĐỂ UPDATE HOẶC THÊM MỚI/////////////
    await this.prisma.$transaction(
      entries.map(([key, value]) => //duyệt qua từng mảng
      //từ mảng [bankname, Mbbank] theo dạng key value -> key = 'bankname' ; value 'MB Bank'

      //upsert: nếu bản ghi đã tồn tại thì update, không thì tạo mới
        this.prisma.systemSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    return this.getBankSettings();
  }



    ////////////////lấy thông tin tài khoản đã được cấu hình sẵn trong database///////////////
    private async readBankSettings(): Promise<UpdateBankSettingsDto | null> {

      //BƯỚC 1: lấy thông tin ngân hàng từ database
      const rows = await this.prisma.systemSetting.findMany({
        where: { key: { in: Object.values(BANK_SETTING_KEYS) } },
      });

      //BƯỚC 2: chuyển dữ liệu được trả về thành dạng map key-value (cho dễ tìm kiếm ở buốc 3)
      const values = new Map(rows.map(({ key, value }) => [key, value]));

      //BƯỚC 3: lấy thông tin từng ngân hàng
      const bankName = values.get(BANK_SETTING_KEYS.bankName);
      const bankBin = values.get(BANK_SETTING_KEYS.bankBin);
      const bankAccountNumber = values.get(BANK_SETTING_KEYS.bankAccountNumber,);
      const bankAccountName = values.get(BANK_SETTING_KEYS.bankAccountName);

      //nếu lỗi gì đó thì trả vveef null
      if (!bankName || !bankBin || !bankAccountNumber || !bankAccountName) {
        return null;
      }

      return { bankName, bankBin, bankAccountNumber, bankAccountName };
    }

  ///////////////////////TẠO MÃ QR////////////////////////////
  private createQrUrl(order: {
    bankBin: string;
    bankAccountNumber: string;
    bankAccountName: string;
    expectedAmount: number;
    transferCode: string;
  }) {
    const query = new URLSearchParams({
      amount: String(order.expectedAmount),
      addInfo: order.transferCode,
      accountName: order.bankAccountName,
    });
    return `https://img.vietqr.io/image/${encodeURIComponent(order.bankBin)}-${encodeURIComponent(order.bankAccountNumber)}-compact2.png?${query.toString()}`;
  }
  getAdminPaymentOrders(...args: Parameters<PaymentAdminQueryService['getAdminPaymentOrders']>) {
    return this.paymentAdminQueryService.getAdminPaymentOrders(...args);
  }

  getAdminBankTransactions(...args: Parameters<PaymentAdminQueryService['getAdminBankTransactions']>) {
    return this.paymentAdminQueryService.getAdminBankTransactions(...args);
  }

  assignBankTransaction(...args: Parameters<PaymentReconciliationService['assignBankTransaction']>) {
    return this.paymentReconciliationService.assignBankTransaction(...args);
  }

  confirmPaymentOrderManually(...args: Parameters<PaymentReconciliationService['confirmPaymentOrderManually']>) {
    return this.paymentReconciliationService.confirmPaymentOrderManually(...args);
  }

  handleSepayWebhook(...args: Parameters<SepayWebhookService['handleSepayWebhook']>) {
    return this.sepayWebhookService.handleSepayWebhook(...args);
  }
}
