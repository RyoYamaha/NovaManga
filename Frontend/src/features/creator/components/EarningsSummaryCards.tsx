import { ArrowUpRight, Banknote, Clock, Coins, TrendingUp } from 'lucide-react'
import type { RevenueSummary } from '@/services/finance.service'

interface EarningsSummaryCardsProps {
  summary?: RevenueSummary
  availableCoins: number
  minimumCoins: number
  payoutCount: number
  formatCoins: (value: number) => string
  onSelectMax: () => void
}

export function EarningsSummaryCards({
  summary,
  availableCoins,
  minimumCoins,
  payoutCount,
  formatCoins,
  onSelectMax,
}: EarningsSummaryCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-[#131b26] to-[#131b26] p-5 shadow-lg shadow-emerald-950/20 transition-all hover:border-emerald-500/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Có thể rút ngay</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Banknote className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="flex items-baseline gap-1.5 text-3xl font-black text-white">
            {formatCoins(availableCoins)}
            <span className="text-xs font-bold text-emerald-400">coin</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-300/80">
            ≈ {formatCoins(availableCoins * 1000)} VNĐ
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-emerald-500/20 pt-3">
          <span className="text-[11px] text-muted-foreground">Sẵn sàng rút</span>
          {availableCoins >= minimumCoins && (
            <button
              type="button"
              onClick={onSelectMax}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
            >
              Rút tối đa <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-[#131b26] to-[#131b26] p-5 shadow-sm transition-all hover:border-sky-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Thu nhập của bạn</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="flex items-baseline gap-1.5 text-3xl font-black text-white">
            {formatCoins(summary?.totalEarnedCoins ?? 0)}
            <span className="text-xs font-bold text-sky-400">coin</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Sau khi trừ phí hoa hồng sàn</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-muted-foreground">
          <span>Tổng lượt mua</span>
          <span className="font-bold text-white">{summary?.totalSales ?? 0} lượt</span>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#131b26] to-[#131b26] p-5 shadow-sm transition-all hover:border-amber-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Đang giữ / Đã trả</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="flex items-baseline gap-1.5 text-3xl font-black text-white">
            {formatCoins(summary?.reservedCoins ?? 0)}
            <span className="text-xs font-bold text-amber-400">coin</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Đang chờ chuyển khoản hoặc đã giải ngân</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-muted-foreground">
          <span>Lệnh rút tiền</span>
          <span className="font-bold text-white">{payoutCount} lệnh</span>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-[#131b26] to-[#131b26] p-5 shadow-sm transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Tổng doanh số bán</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="flex items-baseline gap-1.5 text-3xl font-black text-white">
            {formatCoins(summary?.totalGrossCoins ?? 0)}
            <span className="text-xs font-bold text-purple-400">coin</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Giá trị toàn bộ chương trả phí</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-muted-foreground">
          <span>Tỷ lệ phân chia</span>
          <span className="font-bold text-purple-300">Min 70%</span>
        </div>
      </div>
    </section>
  )
}
