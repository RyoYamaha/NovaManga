import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { isUniqueConstraintError } from './payment-errors';

interface SepayEvent {
  externalId: string;
  transferType: string;
  transferAmount: number;
  description: string;
  rawPayload: string;
  transferCode: string | null;
  accountNumber: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object') {
    return false;
  }

  if (value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  return true;
}

function asText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue;
}

function parseSepayEvent(payload: unknown): SepayEvent | null {
  if (!isRecord(payload)) {
    return null;
  }

  //BƯỚC 1: lấy mã giao dịch từ payload.id , chuyển nó thành chuỗi hợp lệ
  //loại bỏ các trường hợp điền sai và chuẩn hóa dữ liệu nhập vào

    const rawId = payload.id;
    let externalId: string | null = null;

    //xác định nó phải là chuỗi , cắt khoảng trống
    if (typeof rawId === 'string') {
      const trimmedId = rawId.trim();
      //lưu id lại
      if (trimmedId !== '') {
        externalId = trimmedId;
      }
      // và kiểm tra số nguyên an toàn và không âm
    } else if (typeof rawId === 'number') {
      if (Number.isSafeInteger(rawId) && rawId >= 0) {
        externalId = String(rawId);
      }
    }
  //BƯỚC 2: lấy số tiền và loại giao dịch
  const amount = payload.transferAmount;
  const transferType = asText(payload.transferType)?.toLowerCase();


  //BƯỚC 3: KIỂM TRA DỮ LIỆU TRƯỚC KHI XỬ LÝ TIẾP
  if (
    !externalId || //không có mã giao dịch hợp lệ
    externalId.length > 100 || //mã giao dịch kéo dài quá 100 kí tự
    typeof amount !== 'number' || //số tiền không phải kiêu số
    !Number.isSafeInteger(amount) || //số tiền không phải số nguyên an toàn
    amount < 0 || //số tiền nhỏ hơn 0
    amount > 2_147_483_647 || //số tiên lớn quá mức quy định
    !transferType
  ) {
    return null;
  }

  //BƯỚC 4: GOM CÁC TRƯỜNG NỘI DUNG CHUYỂN KHOẢN
  const textFields = [payload.code, payload.content, payload.description].map(asText)
  //map lại các trường nội dung thành mảng text

  .filter((value): value is string => value !== null);
  //giữ lại các phần tử đáp ứn đủ điều kiện


  const description = textFields.join(' | '); //ngăn cách các phần tử thành 1 chuỗi ngăn bằng |
  //vd description = 'NM12345678 | Thanh toan don hang';

  //tìm mã đơn chuyển khoản trong description , tách chúng ra lưu vào biến
  const transferCode = description.match(/(?:^|[^A-Z0-9])(NM[A-F0-9]{8})(?:$|[^A-Z0-9])/i,)?.[1]?.toUpperCase();
  const accountNumber = asText(payload.accountNumber);

  return {
    externalId,
    transferType,
    transferAmount: amount,
    description,
    rawPayload: JSON.stringify(payload),
    transferCode: transferCode ?? null,
    accountNumber,
  };
}

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentReconciliationService: PaymentReconciliationService,
  ) {}




  ///////////////////9. HÀM XỬ LÝ WEBHOOK: GHI NHẬN GIAO DỊCH VÀ CỘNG COIN///////////////////

  //LƯU Ý: đơn nạp tiền là yêu cầu người dùng
  //còn giao dịch ngân hàng là sự kiện chuyển tiền xảy ra từ ngân hàng

  // BƯỚC 1–4: Kiểm tra và phân tích dữ liệu webhook SePay gửi lên
  // BƯỚC 5: Lưu lịch sử giao dịch ngân hàng vào database
  // BƯỚC 6–7: Tìm đơn nạp tiền tương ứng, cập nhật trạng thái đơn và xác nhận đơn chưa được xử lý trước đó
  // BƯỚC 8–9: Cộng coin vào ví người dùng và lưu lịch sử biến động số dư

  async handleSepayWebhook(payload: unknown) {

    //payload: dữ liệu SePay gửi đến API webhook
    //unknow: typescript chưa cho phép dữ liệu nhận vào có cấu trúc chính xác


    //BƯỚC 1: NHẬN VÀ KIỂM TRA DỮ LIỆU WEBHOOK
    const event = parseSepayEvent(payload);
    //hàm kiểm tra và phân tích dữ liệu , trả về thông tin giao dịch

    //nếu không hợp lệ thì báo lỗi
    if (!event) {
      this.logger.warn('Ignored malformed SePay webhook payload');
      return { success: true, ignored: true };
    }

    //BƯỚC 2: KIỂM TRA GIAO DỊCH ĐÃ TỒN TẠI CHƯA

    //2.1: kiểm tra lần 1 (tránh việc thông tin đã được tạo trước)
    const existing = await this.prisma.bankTransaction.findUnique({where: { externalId: event.externalId },
      select: { processingStatus: true },
    });

    //nếu đã tồn tại, trả lại
    if (existing) {
      return {
        success: true,
        duplicate: true,
        processingStatus: existing.processingStatus,
      };
    }

    //2.2: kiểm tra lần 2  (tránh việc thông tin nó bị duplicate khi xử lý đồng thời với cái khác)
    //giúp tránh tiến trình khác đang xử lý đồng thời (cùng bị trùng)
    try {
      return await this.prisma.$transaction(async (tx) => {
        //tx: đối tượng Prisma dùng để thực hiện truy vấn nằm trong transaction đó

        const duplicate = await tx.bankTransaction.findUnique({
          where: { externalId: event.externalId },
          select: { processingStatus: true },
        });

        if (duplicate) {
          return {
            success: true,
            duplicate: true,
            processingStatus: duplicate.processingStatus,
          };
        }
        //BƯỚC 3: KIỂM TRA XEM GIAO DỊCH CÓ VÀI CHUYỂN TIỀN VÀO VÀ CÓ MÃ CHUYỂN KHOẢN HAY KHÔNG

        //? và : tương đương với if và else
        const order = event.transferType === 'in' && event.transferCode
          //điều kiện (giống như điều kiện if else)
          //trasfertype = in : giao dịch tiền vào
          //và giao dịch có mã chuyển khoản để đối chiếu
          // (kiểu trong bảng nó có cột là transferocde , tương tự với transfer type)

             ? await tx.paymentOrder.findUnique({where: { transferCode: event.transferCode }})
            //tìm đơn nạp tiền có mã transfercode tương ứng, nếu có thì lưu lại vào order

            : null;
            //nếu không có thì order ==null


        //BƯỚC 4: XÁC ĐỊNH PROCESSINGSTATUS


        let processingStatus = 'Ignored';
        if (event.transferType === 'in') {
          processingStatus = 'Unmatched';
        }
        //giao dịch tiền vào mặc địch là unmantched
        //nếu là giao dịch tiền khác kiểu ra thì ignored

        //nếu số tiền không chia hết cho 1000 thì cần review lại
        if (
          order &&
          event.accountNumber !== null &&
          event.accountNumber !== order.bankAccountNumber
        ) {
          processingStatus = 'WrongAccount';
        } else if (order && event.transferAmount % 1000 !== 0) {
          processingStatus = 'NeedsReview';

        //nếu số tiền bằng 0 thì cần review lại (không hợp lệ để nạp)
        } else if (order && event.transferAmount === 0) {
          processingStatus = 'NeedsReview';

        //có đơn và trạng thái không phải pending ,
        //đơn không còn chờ thanh toán vì thanh toán thành công
        } else if (order && order.status !== 'Pending') {
          processingStatus = 'OrderAlreadyPaid';

        //thỏa mãn được tất cả các điều kiện trene
        //đã nhận giao dịch và chuyển sang bước tiếp theo
        } else if (order) {
          processingStatus = 'Received';
        }


        //BƯỚC 5: TẠO BẢN GHI VỀ GIAO DỊCH CHO VIỆC TRA CỨU VÀ ĐỐI CHIẾU SAU NÀY (LỊCH SỬ )
        const bankTransaction = await tx.bankTransaction.create({
          data: {
            externalId: event.externalId, //id của giao dịch
            paymentOrderId: order?.id, //liên kết với đơn nạp tiền nếu tìm thấy đơn
            transferType: event.transferType,
            transferAmount: event.transferAmount, //số tiền chuyển khoản
            destinationAccountNumber: event.accountNumber,
            description: event.description,
            rawPayload: event.rawPayload, //lưu dữ liệu webhook gốc (để kiểm tra lỗi)
            processingStatus, //trạng thái vừa xác định ở bước 4
          },
        });



        //BƯỚC 6: KIỂM TRA VÀ CHUYỂN ĐỔI TIỀN THÀNH XU


        //nếu không tìm thấy đơn nạp tiền (order) hoặc processing status khác recevied
        if (!order || processingStatus !== 'Received') {
          return {
            success: true,
            ignored: processingStatus !== 'Received',
            processingStatus,
          };
        }


        return this.paymentReconciliationService.applyConfirmedDeposit(
          tx,
          order,
          bankTransaction.id,
          event.externalId,
          event.transferAmount,
          `SePay deposit for order ${order.id}`,
        );
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicate = await this.prisma.bankTransaction.findUnique({
          where: { externalId: event.externalId },
          select: { processingStatus: true },
        });
        if (duplicate) {
          return {
            success: true,
            duplicate: true,
            processingStatus: duplicate.processingStatus,
          };
        }
      }
      throw error;

    }
  }
}
