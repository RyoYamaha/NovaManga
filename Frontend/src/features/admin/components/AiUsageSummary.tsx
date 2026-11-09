import type { ReactNode } from 'react'
import { Bot, Coins, Users, Zap } from 'lucide-react'
import type { AiUsageStats } from '@/features/ai/types/ai'

interface AiUsageSummaryProps {
  enabled?: boolean
  stats?: AiUsageStats
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  badge,
  badgeColor = 'emerald',
}: {
  icon: ReactNode
  label: string
  value: string
  subtext?: string
  badge?: string
  badgeColor?: 'emerald' | 'rose'
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#121924]/80 p-5 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              badgeColor === 'emerald'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/15 text-rose-400'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-white">{value}</p>
      {subtext && <p className="mt-1 text-[11px] text-muted-foreground">{subtext}</p>}
    </div>
  )
}

export function AiUsageSummary({ enabled, stats }: AiUsageSummaryProps) {
  const totalTokens = (stats?.promptTokens ?? 0) + (stats?.completionTokens ?? 0)

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Bot className="h-5 w-5 text-primary" />}
        label="Trạng thái hệ thống"
        value={enabled ? 'Đang hoạt động' : 'Tạm dừng'}
        badge={enabled ? 'Bật' : 'Tắt'}
        badgeColor={enabled ? 'emerald' : 'rose'}
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-sky-400" />}
        label="Tổng lượt truy vấn"
        value={stats?.totalRequests.toLocaleString('vi-VN') ?? '0'}
        subtext={`Lỗi: ${stats?.failedRequests ?? 0}`}
      />
      <StatCard
        icon={<Zap className="h-5 w-5 text-amber-400" />}
        label="Tổng token tiêu thụ"
        value={totalTokens.toLocaleString('vi-VN')}
        subtext={`Prompt: ${stats?.promptTokens.toLocaleString('vi-VN') ?? 0}`}
      />
      <StatCard
        icon={<Coins className="h-5 w-5 text-emerald-400" />}
        label="Chi phí ước tính"
        value={stats?.estimatedCostUsd == null ? 'Chưa cấu hình đơn giá' : `$${stats.estimatedCostUsd.toFixed(4)}`}
        subtext="Tính theo giá Gemini API"
      />
    </section>
  )
}
