import { AlertCircle, Check, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import type {
  AdminBankTransaction,
  AdminPaymentOrder,
  PageResult,
} from '@/services/finance.service'

interface PendingPaymentOrdersPanelProps {
  data?: PageResult<AdminPaymentOrder>
  isLoading: boolean
  isError: boolean
  bankTransactions: AdminBankTransaction[]
  isCheckingTransactions: boolean
  transactionCheckError: boolean
  page: number
  isConfirming: boolean
  confirmErrorMessage?: string
  onPageChange: (page: number) => void
  onConfirmMatchedTransaction: (
    order: AdminPaymentOrder,
    transaction: AdminBankTransaction,
  ) => void
  onConfirmManually: (order: AdminPaymentOrder) => void
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function PendingPaymentOrdersPanel({
  data,
  isLoading,
  isError,
  bankTransactions,
  isCheckingTransactions,
  transactionCheckError,
  page,
  isConfirming,
  confirmErrorMessage,
  onPageChange,
  onConfirmMatchedTransaction,
  onConfirmManually,
}: PendingPaymentOrdersPanelProps) {
  const findMatchedTransaction = (order: AdminPaymentOrder) => {
    const matches = bankTransactions.filter((transaction) => {
      const transferCode = transaction.description.match(
        /(?:^|[^A-Z0-9])(NM[A-F0-9]{8})(?:$|[^A-Z0-9])/i,
      )?.[1]

      return (
        transaction.processingStatus === 'Unmatched' &&
        transaction.paymentOrderId === null &&
        transferCode?.toUpperCase() === order.transferCode.toUpperCase() &&
        transaction.transferAmount === order.expectedAmount &&
        transaction.destinationAccountNumber === order.bankAccountNumber
      )
    })

    return matches.length === 1 ? matches[0] : null
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
      <div>
        <h2 className="font-semibold">Đơn nạp đang chờ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Giao dịch bình thường được webhook tự cộng coin. Nếu đơn vẫn đang chờ, hãy kiểm tra sao kê rồi xác nhận thủ công tại đây.
        </p>
      </div>

      {confirmErrorMessage && (
        <p className="text-sm text-destructive" role="alert">{confirmErrorMessage}</p>
      )}

      {isLoading ? (
        <p className="py-5 text-center text-sm text-muted-foreground">Đang tải đơn nạp...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Không tải được danh sách đơn nạp.</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Không có đơn nạp đang chờ.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Người dùng</th>
                <th className="p-4">Mã đơn</th>
                <th className="p-4 text-right">Số tiền dự kiến</th>
                <th className="p-4">Đối chiếu sao kê</th>
                <th className="p-4">Hạn QR</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.items.map((order) => {
                const matchedTransaction = findMatchedTransaction(order)

                return (
                  <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="p-4">
                      <p className="font-medium">{order.user.username}</p>
                      <p className="text-xs text-muted-foreground">{order.user.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs">{order.transferCode}</span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-right font-semibold">
                      {formatVnd(order.expectedAmount)}
                    </td>
                    <td className="p-3">
                      {matchedTransaction ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Khớp sao kê
                          </span>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {matchedTransaction.externalId}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatVnd(matchedTransaction.transferAmount)}
                          </p>
                        </div>
                      ) : transactionCheckError ? (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Sao kê không tải được
                        </span>
                      ) : isCheckingTransactions ? (
                        <span className="text-xs text-muted-foreground">Đang đối chiếu...</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa có giao dịch khớp</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3">{formatDate(order.expiresAt)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {matchedTransaction && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isConfirming}
                            onClick={() => onConfirmMatchedTransaction(order, matchedTransaction)}
                          >
                            <Check className="h-4 w-4" />
                            Xác nhận nạp
                          </Button>
                        )}
                        {!matchedTransaction && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isConfirming}
                            onClick={() => onConfirmManually(order)}
                          >
                            Xác nhận thủ công
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c121b] p-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Trang trước
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PageJumpInput currentPage={page} totalPages={data.totalPages} onPageChange={onPageChange} />
            <span className="text-xs text-muted-foreground">· {data.total} đơn nạp</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}

    </section>
  )
}
