import type { FormEventHandler } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import type {
  AdminBankTransaction,
  AdminPaymentOrder,
  PageResult,
} from '@/services/finance.service'

const TRANSACTION_STATUSES = [
  { value: '', label: 'Tất cả cần đối soát' },
  { value: 'Unmatched', label: 'Chưa khớp' },
  { value: 'NeedsReview', label: 'Cần rà soát' },
  { value: 'WrongAccount', label: 'Sai tài khoản nhận' },
  { value: 'OrderAlreadyPaid', label: 'Đơn đã thanh toán' },
]

interface BankTransactionsPanelProps {
  data?: PageResult<AdminBankTransaction>
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  status: string
  page: number
  onStatusChange: (status: string) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
  assigningTransactionId: string
  orderOptions: AdminPaymentOrder[]
  orderOptionsError: boolean
  assignOrderId: string
  assignReason: string
  assignPending: boolean
  assignErrorMessage?: string
  onSelectTransaction: (transactionId: string) => void
  onAssignOrderChange: (orderId: string) => void
  onAssignReasonChange: (reason: string) => void
  onAssignSubmit: FormEventHandler<HTMLFormElement>
  onCancelAssign: () => void
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

function getTransactionStatus(status: string) {
  if (status === 'Unmatched') return 'Chưa khớp'
  if (status === 'NeedsReview') return 'Cần rà soát'
  if (status === 'WrongAccount') return 'Sai tài khoản nhận'
  if (status === 'OrderAlreadyPaid') return 'Đơn đã được thanh toán'
  if (status === 'Applied') return 'Đã cộng coin'
  return status
}

export function BankTransactionsPanel({
  data,
  isLoading,
  isError,
  isFetching,
  status,
  page,
  onStatusChange,
  onPageChange,
  onRefresh,
  assigningTransactionId,
  orderOptions,
  orderOptionsError,
  assignOrderId,
  assignReason,
  assignPending,
  assignErrorMessage,
  onSelectTransaction,
  onAssignOrderChange,
  onAssignReasonChange,
  onAssignSubmit,
  onCancelAssign,
}: BankTransactionsPanelProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Giao dịch ngân hàng cần đối soát</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách tự làm mới mỗi 10 giây. Chỉ giao dịch “Chưa khớp” mới có thể gán tự động.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9.5 rounded-xl border border-white/10 bg-[#0b0f17] px-3 text-xs text-foreground focus:outline-none focus:border-primary"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Lọc trạng thái giao dịch"
          >
            {TRANSACTION_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Đang tải giao dịch...</p>
      ) : isError ? (
        <p className="rounded-lg border border-border p-4 text-center text-sm text-destructive">
          Không tải được giao dịch ngân hàng.
        </p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Không có giao dịch cần xử lý.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Thời gian / mã ngân hàng</th>
                <th className="p-4">Nội dung giao dịch</th>
                <th className="p-4">Tài khoản nhận</th>
                <th className="p-4 text-right">Số tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.items.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="p-4">
                    <p className="whitespace-nowrap">{formatDate(transaction.receivedAt)}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{transaction.externalId}</p>
                  </td>
                  <td className="max-w-xs p-3">
                    <p className="truncate" title={transaction.description}>{transaction.description}</p>
                    {transaction.paymentOrder && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Đơn của {transaction.paymentOrder.user.username}
                      </p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {transaction.destinationAccountNumber ?? 'SePay không gửi'}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-semibold">{formatVnd(transaction.transferAmount)}</td>
                  <td className="p-3">{getTransactionStatus(transaction.processingStatus)}</td>
                  <td className="p-3">
                    {transaction.processingStatus === 'Unmatched' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectTransaction(transaction.id)}
                      >
                        Gán vào đơn
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Cần kiểm tra thủ công</span>
                    )}
                  </td>
                </tr>
              ))}
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
            <span className="text-xs text-muted-foreground">· {data.total} giao dịch</span>
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

      {assigningTransactionId && (
        <form onSubmit={onAssignSubmit} className="grid gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
          <label className="space-y-1.5 text-sm font-medium">
            Đơn nạp đang chờ
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={assignOrderId}
              onChange={(event) => onAssignOrderChange(event.target.value)}
              required
            >
              <option value="">Chọn đơn nạp...</option>
              {orderOptions.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.user.username} · {order.transferCode} · {formatVnd(order.expectedAmount)}
                </option>
              ))}
            </select>
            {orderOptionsError && (
              <span className="block text-xs text-destructive">
                Không tải được danh sách đơn nạp để đối soát.
              </span>
            )}
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Lý do đối soát
            <Input minLength={3} maxLength={500} value={assignReason} onChange={(event) => onAssignReasonChange(event.target.value)} required />
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={assignPending || !assignOrderId || assignReason.trim().length < 3}>
              {assignPending ? 'Đang xử lý...' : 'Xác nhận gán'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancelAssign}>
              Hủy
            </Button>
          </div>
          {assignErrorMessage && (
            <p className="text-sm text-destructive md:col-span-3" role="alert">
              {assignErrorMessage}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
