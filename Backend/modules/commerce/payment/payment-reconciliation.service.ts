import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignBankTransactionDto } from './dto/assign-bank-transaction.dto';
import { ConfirmPaymentOrderDto } from './dto/confirm-payment-order.dto';
import { isUniqueConstraintError } from './payment-errors';

@Injectable()
export class PaymentReconciliationService {
  constructor(private readonly prisma: PrismaService) {}



////////////////////7. HÀM ADMIN LẤY GIAO DỊCH NGÂN HÀNG GÁN VÀO ĐƠN NẠP////////////////////

  async assignBankTransaction( adminId: string, bankTransactionId: string, dto: AssignBankTransactionDto) {
    // adminId: Admin nào đang thực hiện thao tác.
    //bankTransactionId: Giao dịch ngân hàng cần gán.
    //dto.paymentOrderId: Đơn nạp muốn gán giao dịch vào.
    //dto.reason: Lý do Admin thực hiện đối soát.
    

    //BƯỚC 1: KIỂM TRA LÝ DO ĐỐI SOÁT
    const reason = dto.reason.trim();
    if (reason.length < 3) {
      throw new BadRequestException('Vui lòng nhập lý do đối soát hợp lệ');
    }

    //BƯỚC 2 TÌM GIAO DỊCH NGÂN HÀNG 

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          //BƯỚC 2.1 TÌM GIAO DỊCH NGÂN HÀNG 
          const bankTransaction = await tx.bankTransaction.findUnique({ where: { id: bankTransactionId }});

          if (!bankTransaction) {
            throw new NotFoundException('Không tìm thấy giao dịch ngân hàng');
          }
          //BƯỚC 2.2 : TÌM GIAO DỊCH CÓ ĐỦ ĐIỀU KIỆN GÁN KHÔNG , VÀ GÁN 
          if ( bankTransaction.transferType !== 'in' || bankTransaction.processingStatus !== 'Unmatched' || bankTransaction.paymentOrderId !== null) {
            throw new ConflictException(
              'Chỉ giao dịch tiền vào chưa khớp mới được gán vào đơn nạp',
            );
          }


      //BƯỚC 3: TÌM ĐƠN NẠP CẦN GÁN 

          const paymentOrder = await tx.paymentOrder.findUnique({  where: { id: dto.paymentOrderId }});

          if (!paymentOrder) {
            throw new NotFoundException('Không tìm thấy đơn nạp tiền');
          }


          if ( bankTransaction.destinationAccountNumber !== null && bankTransaction.destinationAccountNumber !== paymentOrder.bankAccountNumber) {
            //nếu giao dịch có thông tin số tài khoản nhận tiền , số tài khoản phải trùng với tài khoản đơn nạp 


            throw new BadRequestException( 'Giao dịch được chuyển vào tài khoản ngân hàng khác với đơn nạp');
          }

        //BƯỚC 4: KIỂM TRA SỐ TIỀN GIA0 DỊCH
        
          if ( bankTransaction.transferAmount <= 0 || bankTransaction.transferAmount % 1_000 !== 0) {
            //nếu số tiền nhỏ hơn 0 hoặc không chia hết cho 1000
            throw new BadRequestException(
              'Số tiền giao dịch chưa thể quy đổi chính xác thành coin',
            );
          }

          //BƯỚC 5: GHI NHẬN GIAO DỊCH NGÂN HÀNG ĐÃ ĐƯỢC GHÉP VỚI ĐƠN 
          if (paymentOrder.status !== 'Pending') {
            await tx.bankTransaction.update({ where: { id: bankTransaction.id },
              data: {
                paymentOrderId: paymentOrder.id,
                processingStatus: 'OrderAlreadyPaid',
                processedById: adminId,
                adminNote: reason,
              },
            });

            return {
              success: true,
              creditedCoins: 0,
              processingStatus: 'OrderAlreadyPaid',
            };
          } 
         // BƯỚC 6 NẾU ĐƠN VẪN CÒN PENDING , XÁC NHẬN ADMIN ĐÃ NHẬN  

          await tx.bankTransaction.update({ 
            where: { id: bankTransaction.id },
            data: {
              paymentOrderId: paymentOrder.id,
              processingStatus: 'Received',
              processedById: adminId,
              adminNote: reason,
            },
          });

          return this.applyConfirmedDeposit(
            tx,
            paymentOrder,
            bankTransaction.id,
            bankTransaction.externalId,
            bankTransaction.transferAmount,
            `Admin matched bank transaction ${bankTransaction.externalId} to order ${paymentOrder.id}`,
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Mã giao dịch ngân hàng đã được sử dụng',
        );
      }

      throw error;
    }
  }


  ///////////////////////////////8. HÀM XÁC NHẬN THỦ CÔNG ĐƠN NẠP TIỀN CỦA ADMIN/////////////////////////
  async confirmPaymentOrderManually( adminId: string, paymentOrderId: string, dto: ConfirmPaymentOrderDto) {
    //adminId: Admin đang thực hiện xác nhận.
    // paymentOrderId: đơn nạp cần xác nhận.
    // externalId: mã giao dịch ngân hàng.
    // reason: lý do xác nhận.
    // paidAmount: số tiền Admin xác nhận đã nhận.


    const externalId = dto.externalId.trim();
    const reason = dto.reason.trim();


    //BƯỚC 1 KIỂM TRA XEM CÁC THAM SỐ HỢP LỆ HAY KHÔNG
    if (!externalId || externalId.length > 100) {
      throw new BadRequestException('Mã giao dịch ngân hàng không hợp lệ');
    }

    if (reason.length < 3) {
      throw new BadRequestException('Vui lòng nhập lý do xác nhận hợp lệ');
    }

    if (!Number.isSafeInteger(dto.paidAmount) || dto.paidAmount <= 0 || dto.paidAmount % 1_000 !== 0) {
      throw new BadRequestException(
        'Số tiền xác nhận phải là số nguyên dương chia hết cho 1.000 đồng',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {

          //BƯỚC 2: TÌM ĐƠN NẠP TIỀN ĐANG CHỜ THANH TOÁN
          const paymentOrder = await tx.paymentOrder.findUnique({ where: { id: paymentOrderId }});
          

          if (!paymentOrder) {
            throw new NotFoundException('Không tìm thấy đơn nạp tiền');
          }

          if (paymentOrder.status !== 'Pending') {
            throw new ConflictException(
              'Đơn nạp tiền không còn ở trạng thái chờ thanh toán',
            );
          }

          //BƯỚC 3: TÌM TRA XEM MÃ GIAO DỊCH CÓ TỒN TẠI TRONG NGÂN HÀNG KHÔNG (THỦ CÔNG THÌ CHỖ NÀY THƯỜNG LÀ KHÔNG)
          const existingTransaction = await tx.bankTransaction.findUnique({
            where: { externalId },
            select: { id: true, processingStatus: true },
          });

          if (existingTransaction) {
            throw new ConflictException(
              `Giao dịch ngân hàng đã tồn tại với trạng thái ${existingTransaction.processingStatus}`,
            );
          }
          //BƯỚC 4: TẠO GIAO DỊCH NGÂN HÀNG GẮN ĐƠN NẠP TIỀN 
          const bankTransaction = await tx.bankTransaction.create({
            data: {
              externalId,
              paymentOrderId: paymentOrder.id,
              transferType: 'in',
              transferAmount: dto.paidAmount,
              destinationAccountNumber: paymentOrder.bankAccountNumber,
              description: `Manual payment confirmation for order ${paymentOrder.id}`,
              rawPayload: JSON.stringify({
                source: 'admin_manual_confirmation',
                adminId,
                reason,
              }),
              processingStatus: 'Received',
              processedById: adminId,
              adminNote: reason,
            },
          });

          return this.applyConfirmedDeposit(
            tx,
            paymentOrder,
            bankTransaction.id,
            externalId,
            dto.paidAmount,
            `Admin manually confirmed bank transaction ${externalId} for order ${paymentOrder.id}`,
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Mã giao dịch ngân hàng đã được sử dụng',
        );
      }

      throw error;
    }
  }



//////////////////////10. CỘNG COIN VÀO VÍ SAU KHI ADMIN XÁC NHẬN NGÂN HÀNG HỢP LỆ//////////////////  async applyConfirmedDeposit( tx: Prisma.TransactionClient, paymentOrder: { id: string; userId: string },bankTransactionId: string,
    externalId: string,paidAmount: number, description: string) {

    //BƯỚC 1: KIỂM TRA SỐ TIỀN  
    if ( !Number.isSafeInteger(paidAmount) || paidAmount <= 0 || paidAmount % 1_000 !== 0
    ) {
      throw new BadRequestException(
        'Số tiền xác nhận phải là số nguyên dương chia hết cho 1.000 đồng',
      );
    }

    //BƯỚC 2: ĐỔI TIỀN THÀNH COIN RỒI UPDATE VÀO ĐƠN NẠP TIỀN 
    const paidCoins = paidAmount / 1_000;
    const paymentClaim = await tx.paymentOrder.updateMany({
      where: { id: paymentOrder.id, status: 'Pending' },
      data: {
        status: 'Paid',
        paidAmount,
        paidCoins,
        paidAt: new Date(),
      },
    });
    //BƯỚC 3: UPDATE GIAO DỊCH NGÂN HÀNG LÀ ĐÃ TRẢ TIỀN 
    if (paymentClaim.count !== 1) {
      await tx.bankTransaction.update({
        where: { id: bankTransactionId },
        data: { processingStatus: 'OrderAlreadyPaid' },
      });

      return {
        success: true,
        ignored: true,
        processingStatus: 'OrderAlreadyPaid',
      };
    }

    //BƯỚC 4: UPDATE VÍ TIỀN 
    const wallet = await tx.wallet.upsert({
      where: { userId: paymentOrder.userId },
      create: {
        //nếu chưa có giao dịch trước đây thì số dư ban đầu là số tiền người dùng nạp vào
        userId: paymentOrder.userId,
        balance: paidCoins, 
      },
      //nếu có giao dịch rồi thì côgnj vào số dư 
      update: {
        balance: { increment: paidCoins },
      },
    });

    //BƯỚC 5: TẠO LỊCH SỬ GIAO DỊCH VÍ TIỀN 
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        userId: paymentOrder.userId,
        amountCoins: paidCoins,
        balanceAfter: wallet.balance,
        transactionType: 'Deposit',
        sourceType: 'Payment',
        sourceReference: externalId,
        description,
      },
    });

    //BƯỚC 6: GIAO DỊCH ÁP DỤNG VÀO HỆ THỐNG THÀNH CÔNG 
    // Đến đây, hệ thống đã chuyển đơn nạp thành Paid, cập nhật ví và tạo lịch sử ví.
    // giao dịch ngân hàng được đổi sang trạng thái Applied, nghĩa là giao dịch đã được áp dụng vào hệ thống thành công.
    
    await tx.bankTransaction.update({
      where: { id: bankTransactionId },
      data: { processingStatus: 'Applied' },
    });

    return {
      success: true,
      creditedCoins: paidCoins,
      paidAmount,
    };
  }
}
