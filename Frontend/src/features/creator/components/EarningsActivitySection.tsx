import { useMemo, useState } from 'react'
import { Banknote, Clock, Receipt, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  PayoutRequest,
  RevenueHistoryItem,
} from '@/services/finance.service'

type ActivityTab = 'sales' | 'payouts'
type PayoutStatusFilter = 'all' | PayoutRequest['status']

interface EarningsActivitySectionProps {
  historyItems?: RevenueHistoryItem[]
  historyLoading: boolean
  historyError: boolean
  payoutRequests?: PayoutRequest[]
  payoutsLoading: boolean
  payoutsError: boolean
}

function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getPayoutStatusConfig(status: PayoutRequest['status']) {
  if (status === 'Paid') {
    return {
      label: 'Đã thanh toán',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      dotClass: 'bg-emerald-400',
    }
  }
  if (status === 'Rejected') {
    return {
      label: 'Đã từ chối',
      className: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      dotClass: 'bg-rose-400',
    }
  }
  return {
    label: 'Chờ duyệt',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    dotClass: 'bg-amber-400 animate-pulse',
  }
}

export function EarningsActivitySection({
  historyItems = [],
  historyLoading,
  historyError,
  payoutRequests = [],
  payoutsLoading,
  payoutsError,
}: EarningsActivitySectionProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('sales')
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>('all')

  const filteredRequests = useMemo(
    () =>
      statusFilter === 'all'
        ? payoutRequests
        : payoutRequests.filter((request) => request.status === statusFilter),
    [payoutRequests, statusFilter],
  )

  const statusOptions: { value: PayoutStatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Pending', label: 'Chờ duyệt' },
    { value: 'Paid', label: 'Đã thanh toán' },
    { value: 'Rejected', label: 'Bị từ chối' },
  ]

  return (
    <section className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center rounded-2xl border border-white/10 bg-[#131b26] p-1 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'sales'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-white',
            )}
          >
            <Receipt className="h-4 w-4" />
            Lịch sử bán & Doanh thu
            <span className={cn('rounded-full px-2 py-0.2 text-[10px]', activeTab === 'sales' ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300')}>
              {historyItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'payouts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-white',
            )}
          >
            <Clock className="h-4 w-4" />
            Yêu cầu rút tiền
            <span className={cn('rounded-full px-2 py-0.2 text-[10px]', activeTab === 'payouts' ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300')}>
              {payoutRequests.length}
            </span>
          </button>
        </div>

        {activeTab === 'payouts' && (
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'rounded-xl px-3 py-1 text-xs font-semibold transition-all',
                  statusFilter === option.value
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'border border-white/5 bg-[#131b26] text-muted-foreground hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'sales' ? (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#131b26] p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>Đang tải lịch sử doanh số bán...</span>
            </div>
          ) : historyError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-center text-xs text-rose-400">
              Không tải được dữ liệu lịch sử doanh thu.
            </p>
          ) : historyItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/50 py-16 text-center space-y-3">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-bold text-white">Chưa ghi nhận lượt mua nào</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Khi độc giả mua và mở khóa các chương truyện trả phí của bạn, số tiền và tỷ lệ chia sẻ doanh thu sẽ hiển thị chi tiết tại đây.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Tác phẩm</th>
                    <th className="p-4 text-right">Doanh số gốc</th>
                    <th className="p-4 text-center">Tỷ lệ của bạn</th>
                    <th className="p-4 text-right">Thu nhập thực nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap p-4 text-muted-foreground">{formatDate(item.createdAt)}</td>
                      <td className="p-4 font-bold text-white">{item.content.title}</td>
                      <td className="p-4 text-right font-medium text-slate-300">{formatCoins(item.grossCoins)} coin</td>
                      <td className="p-4 text-center">
                        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-bold text-primary">
                          {item.sharePercent}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-400">
                        +{formatCoins(item.creatorCoins)} coin
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {payoutsLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#131b26] p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>Đang tải danh sách yêu cầu rút...</span>
            </div>
          ) : payoutsError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-center text-xs text-rose-400">
              Không tải được các yêu cầu rút coin.
            </p>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/50 py-16 text-center space-y-3">
              <Banknote className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-bold text-white">Chưa có yêu cầu rút coin nào</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Các yêu cầu rút tiền bạn gửi sẽ được lưu lại với đầy đủ thời gian, số tiền và trạng thái xử lý của Admin.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Thời gian gửi</th>
                    <th className="p-4">Tài khoản thụ hưởng</th>
                    <th className="p-4 text-right">Số coin rút</th>
                    <th className="p-4 text-right">Quy đổi ước tính</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4">Ghi chú từ Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRequests.map((request) => {
                    const statusConfig = getPayoutStatusConfig(request.status)
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="whitespace-nowrap p-4 text-muted-foreground">{formatDate(request.requestedAt)}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{request.bankName}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">STK: {request.bankAccountNumber}</div>
                        </td>
                        <td className="whitespace-nowrap p-4 text-right font-black text-amber-400">
                          {formatCoins(request.amountCoins)} coin
                        </td>
                        <td className="whitespace-nowrap p-4 text-right font-bold text-emerald-400">
                          {formatCoins(request.amountCoins * 1000)} đ
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold', statusConfig.className)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotClass)} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="max-w-xs p-4 text-[11px] text-muted-foreground">
                          {request.rejectionReason ? (
                            <span className="text-rose-400 font-semibold">{request.rejectionReason}</span>
                          ) : request.status === 'Paid' ? (
                            <span className="text-emerald-400 font-medium">Đã thanh toán VietQR</span>
                          ) : (
                            'Đang trong hàng đợi đối soát'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
