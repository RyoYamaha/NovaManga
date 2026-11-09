import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryAdminBankTransactionsDto } from './dto/query-admin-bank-transactions.dto';

@Injectable()
export class PaymentAdminQueryService {
  constructor(private readonly prisma: PrismaService) {}



////////////////////5. ADMIN LẤY DANH SÁCH ĐƠN NẠP TRẠNG THÁI PENDING//////////////////////////

  async getAdminPaymentOrders(page: number, limit: number) {

    //BƯỚC 1: TRUY VẤN DANH SÁCH VÀ TỔNG SỐ ĐƠN 

    const [items, total] = await this.prisma.$transaction([
      this.prisma.paymentOrder.findMany({
        where: { status: 'Pending' },
        select: {
          id: true,
          userId: true,
          expectedAmount: true,
          transferCode: true,
          bankName: true,
          bankAccountNumber: true,
          expiresAt: true,
          createdAt: true,
          user: {
            select: { username: true, email: true },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paymentOrder.count({ where: { status: 'Pending' } }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

////////////////////6. LẤY CÁC GIAO DỊCH NGÂN HÀNG TIỀN VÀO CẦN ADMIN XỬ LÝ ĐỐI SOÁT/////////////////
  
async getAdminBankTransactions(query: QueryAdminBankTransactionsDto) {

  //BƯỚC 1: THIẾT LẬP THAM SỐ PHÂN TRANG


    const page = query.page; 
    
    const limit = query.limit;

  //BƯỚC 2: CHỌN TRẠNG THÁI CẦN LẤY 

    let statuses = ['Unmatched', 'NeedsReview', 'WrongAccount', 'OrderAlreadyPaid'];

    //nếu tham số có status 
    if (query.status) {
      //statues sẽ bằng status tương ứng trong mảng 
      statuses = [query.status];
    }


    // BƯỚC 3: LẤY DỮ LIỆU VÀ CÁC THÔNG TIN LIÊN QUAN 
    const [items, total] = await this.prisma.$transaction([
      this.prisma.bankTransaction.findMany({
        where: { processingStatus: { in: statuses }, transferType: 'in', },
         //trạng thái xử lý phải trong cái mảng statues và phải là loại chuyển tiền vào 
        select: {
          id: true,
          externalId: true,
          paymentOrderId: true,
          transferAmount: true,
          destinationAccountNumber: true,
          description: true,
          processingStatus: true,
          adminNote: true,
          receivedAt: true,
          paymentOrder: {
            select: {
              id: true,
              status: true,
              expectedAmount: true,
              user: {
                select: { id: true, username: true, email: true },
              },
            },
          },
        },
        orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bankTransaction.count({ where: {processingStatus: { in: statuses }, transferType: 'in',} }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
