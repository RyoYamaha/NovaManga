import type { FormEventHandler } from 'react'
import { Check, Copy, ExternalLink, QrCode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PayoutRequest } from '@/services/finance.service'
import {
  formatCoins,
  formatDate,
  formatVnd,
  getPayoutQrUrl,
  getPayoutTransferCode,
  VND_PER_COIN,
} from '@/features/admin/utils/payout'

interface PayoutRequestsTableProps {
  requests: PayoutRequest[]
  showProcessed?: boolean
  selectedTransferId: string
  selectedRejectId: string
  rejectReason: string
  copiedTransferCode: string
  copyError: string
  isRejectPending: boolean
  rejectErrorMessage?: string
  isMarkPaidPending: boolean
  markPaidErrorMessage?: string
  onToggleTransfer: (requestId: string) => void
  onStartReject: (requestId: string) => void
  onRejectReasonChange: (reason: string) => void
  onSubmitReject: FormEventHandler<HTMLFormElement>
  onCancelReject: () => void
  onCopyTransferCode: (requestId: string) => void
  onMarkPaid: (requestId: string) => void
}

export function PayoutRequestsTable({
  requests,
  showProcessed = false,
  selectedTransferId,
  selectedRejectId,
  rejectReason,
  copiedTransferCode,
  copyError,
  isRejectPending,
  rejectErrorMessage,
  isMarkPaidPending,
  markPaidErrorMessage,
  onToggleTransfer,
  onStartReject,
  onRejectReasonChange,
  onSubmitReject,
  onCancelReject,
  onCopyTransferCode,
  onMarkPaid,
}: PayoutRequestsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101722]">
      <p className="px-3 py-2 text-xs text-muted-foreground sm:hidden">
        Vuốt ngang để xem đầy đủ thông tin và thao tác.
      </p>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="sticky top-0 border-b border-white/10 bg-[#17212e] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Tác giả / Publisher</th>
            <th className="px-4 py-3">Tài khoản nhận</th>
            <th className="px-4 py-3 text-right">Coin</th>
            <th className="px-4 py-3">Ngày gửi</th>
            <th className="px-4 py-3">{showProcessed ? 'Trạng thái xử lý' : 'Thao tác'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {requests.flatMap((request) => {
            const requestRow = (
              <tr key={request.id} className="align-top transition-colors hover:bg-white/[0.025]">
                <td className="px-4 py-4">
                  <p className="font-medium">{request.user?.username ?? request.userId}</p>
                  <p className="text-xs text-muted-foreground">{request.user?.email}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{request.bankAccountName}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.bankName} · {request.bankBin}
                  </p>
                  <p className="font-mono text-xs">{request.bankAccountNumber}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">
                  {formatCoins(request.amountCoins)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                  {formatDate(request.requestedAt)}
                </td>
                <td className="px-4 py-4">
                  {showProcessed ? (
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          request.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {request.status === 'Paid' ? 'Đã chuyển khoản' : 'Đã từ chối'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Xử lý: {request.processedAt ? formatDate(request.processedAt) : '—'}
                      </p>
                      {request.rejectionReason && (
                        <p className="max-w-sm text-xs text-rose-300">
                          Lý do: {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedTransferId === request.id ? 'secondary' : 'default'}
                      onClick={() => onToggleTransfer(request.id)}
                    >
                      <QrCode className="h-4 w-4" />
                      {selectedTransferId === request.id ? 'Đóng QR' : 'Mở QR chuyển khoản'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onStartReject(request.id)}
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </Button>
                  </div>
                  {selectedRejectId === request.id && (
                    <form onSubmit={onSubmitReject} className="flex min-w-[300px] gap-2">
                      <Input
                        value={rejectReason}
                        onChange={(event) => onRejectReasonChange(event.target.value)}
                        placeholder="Lý do từ chối"
                        minLength={3}
                        maxLength={500}
                        required
                        className="min-w-0 flex-1"
                      />
                      <Button type="submit" size="sm" variant="destructive" disabled={isRejectPending}>
                        Xác nhận
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={onCancelReject}>
                        Hủy
                      </Button>
                    </form>
                  )}
                  {rejectErrorMessage && selectedRejectId === request.id && (
                    <p className="text-xs text-destructive" role="alert">
                      {rejectErrorMessage}
                    </p>
                  )}
                    </div>
                  )}
                </td>
              </tr>
            )

            if (showProcessed || selectedTransferId !== request.id) {
              return [requestRow]
            }

            const qrUrl = getPayoutQrUrl(request)
            const transferCode = getPayoutTransferCode(request.id)
            const amountVnd = request.amountCoins * VND_PER_COIN
            const transferRow = (
              <tr key={`${request.id}-transfer`}>
                <td colSpan={5} className="border-t border-white/10 bg-white/[0.02] p-4 sm:p-6">
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold">
                          <QrCode className="h-4 w-4 text-primary" />
                          QR chuyển payout
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Quét bằng ứng dụng ngân hàng; thông tin người nhận, số tiền và nội dung đã được điền sẵn.
                        </p>
                      </div>
                      <dl className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Ngân hàng</dt>
                          <dd className="font-semibold">
                            {request.bankName} · BIN {request.bankBin}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Số tài khoản</dt>
                          <dd className="font-mono font-semibold">{request.bankAccountNumber}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Chủ tài khoản</dt>
                          <dd className="font-semibold">{request.bankAccountName}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Số tiền chuyển</dt>
                          <dd className="font-semibold">
                            {formatVnd(amountVnd)} ({formatCoins(request.amountCoins)} coin)
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-muted-foreground">Nội dung chuyển khoản</dt>
                          <dd className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-muted px-2 py-1 font-mono font-semibold">
                              {transferCode}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onCopyTransferCode(request.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedTransferCode === request.id ? 'Đã sao chép' : 'Sao chép'}
                            </Button>
                            {copyError && (
                              <span className="text-xs text-destructive">{copyError}</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                      <p className="text-xs text-muted-foreground">
                        Chỉ xác nhận sau khi ứng dụng ngân hàng báo giao dịch chuyển khoản thành công và bạn đã kiểm tra đúng người nhận.
                      </p>
                      <Button
                        type="button"
                        onClick={() => onMarkPaid(request.id)}
                        disabled={isMarkPaidPending}
                      >
                        <Check className="h-4 w-4" />
                        {isMarkPaidPending ? 'Đang cập nhật...' : 'Xác nhận đã chuyển'}
                      </Button>
                      {markPaidErrorMessage && (
                        <p className="text-sm text-destructive" role="alert">
                          {markPaidErrorMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-4">
                      {qrUrl ? (
                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex flex-col items-center gap-2"
                        >
                          <img
                            src={qrUrl}
                            alt={`QR chuyển ${formatVnd(amountVnd)} đến ${request.bankAccountName}, nội dung ${transferCode}`}
                            className="h-60 w-60 max-w-full rounded-lg bg-white object-contain p-2"
                          />
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
                            Mở QR riêng <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ) : (
                        <p className="text-sm text-destructive">
                          Không thể tạo QR do số tiền payout không hợp lệ.
                        </p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )

            return [requestRow, transferRow]
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
