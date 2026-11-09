import {
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DepositOrderDisplay } from '@/features/wallet/types/wallet'

interface ActiveDepositOrderProps {
  order: DepositOrderDisplay
  isFetching: boolean
  hasStatusError: boolean
  showQr: boolean
  copiedField: string
  copyError: string
  onRefresh: () => void
  onCopy: (field: string, value: string) => void
}

function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function DepositStatus({ order }: { order: DepositOrderDisplay }) {
  if (order.status === 'Paid') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Đã nạp thành công {formatCoins(order.paidCoins ?? 0)} coin.
      </div>
    )
  }

  if (order.isExpired) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
        Mã QR đã hết thời gian hiển thị. Nếu bạn đã chuyển tiền, giao dịch vẫn
        được đối soát khi ngân hàng gửi thông báo.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs text-cyan-300">
      <Clock3 className="h-4 w-4 shrink-0 text-primary" />
      Đang chờ ngân hàng xác nhận. Trạng thái được kiểm tra tự động mỗi 5 giây.
    </div>
  )
}

export function ActiveDepositOrder({
  order,
  isFetching,
  hasStatusError,
  showQr,
  copiedField,
  copyError,
  onRefresh,
  onCopy,
}: ActiveDepositOrderProps) {
  return (
    <section className="grid gap-5 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Chi tiết đơn nạp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mã đơn: <span className="font-mono font-semibold text-foreground">{order.transferCode}</span>
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Kiểm tra đơn và số dư
          </Button>
        </div>

        {hasStatusError && (
          <p className="text-sm text-destructive" role="alert">
            Không kiểm tra được trạng thái đơn. Hệ thống sẽ thử lại tự động.
          </p>
        )}
        <DepositStatus order={order} />

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Số tiền cần chuyển</dt>
            <dd className="font-semibold">{formatVnd(order.expectedAmount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Coin dự kiến</dt>
            <dd className="font-semibold">{formatCoins(order.expectedCoins)} coin</dd>
          </div>
          {order.paidAmount !== null && (
            <div>
              <dt className="text-muted-foreground">Tiền thực nhận</dt>
              <dd className="font-semibold">{formatVnd(order.paidAmount)}</dd>
            </div>
          )}
          {order.paidCoins !== null && (
            <div>
              <dt className="text-muted-foreground">Coin đã cộng</dt>
              <dd className="font-semibold">{formatCoins(order.paidCoins)} coin</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Hạn hiển thị QR</dt>
            <dd>{formatDate(order.expiresAt)}</dd>
          </div>
        </dl>

        {order.bankName && (
          <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
            <p><span className="text-muted-foreground">Ngân hàng:</span> {order.bankName}</p>
            <div className="flex items-center justify-between gap-3">
              <p>
                <span className="text-muted-foreground">Số tài khoản:</span>{' '}
                <span className="font-mono font-semibold">{order.bankAccountNumber}</span>
              </p>
              {order.bankAccountNumber && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onCopy('account', order.bankAccountNumber!)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedField === 'account' ? 'Đã chép' : 'Sao chép'}
                </Button>
              )}
            </div>
            <p><span className="text-muted-foreground">Chủ tài khoản:</span> {order.bankAccountName}</p>
            <div className="flex items-center justify-between gap-3">
              <p>
                <span className="text-muted-foreground">Nội dung:</span>{' '}
                <span className="font-mono font-semibold">{order.transferCode}</span>
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => onCopy('code', order.transferCode)}>
                <Copy className="h-3.5 w-3.5" />
                {copiedField === 'code' ? 'Đã chép' : 'Sao chép'}
              </Button>
            </div>
            {copyError && <p className="text-xs text-destructive">{copyError}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Vui lòng chuyển đúng nội dung. Không bấm xác nhận trước khi ngân hàng
          xử lý; trạng thái được cập nhật từ thông báo của ngân hàng.
        </p>
      </div>

      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-4">
        {showQr && order.qrUrl ? (
          <a
            href={order.qrUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <img
              src={order.qrUrl}
              alt={`Mã QR chuyển khoản ${order.expectedAmount} đồng, nội dung ${order.transferCode}`}
              className="h-64 w-64 max-w-full rounded-lg bg-white object-contain p-2"
            />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
              Mở ảnh QR riêng
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        ) : (
          <div className="max-w-sm space-y-2 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="font-medium">
              {order.status === 'Paid' ? 'Giao dịch đã hoàn tất' : 'Mã QR đã hết hạn hiển thị'}
            </p>
            <p className="text-sm text-muted-foreground">
              Bạn có thể tạo đơn mới. Nếu đã chuyển khoản, đơn cũ vẫn được
              đối soát khi ngân hàng gửi thông báo.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
