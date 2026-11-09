import { AlertCircle, Sparkles } from 'lucide-react'
import type { AiStatus } from '@/features/ai/types/ai'

interface Props {
  status?: AiStatus | null
  className?: string
}

export function AiQuotaBadge({ status, className = '' }: Props) {
  if (!status) return null

  const { available, blocked, limitReached } = status

  if (!available) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive ${className}`}>
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{blocked ? 'Tài khoản bị khóa AI' : 'Trợ lý AI đang tắt'}</span>
      </div>
    )
  }

  if (!limitReached) return null

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 ${className}`}>
      <Sparkles className="h-3.5 w-3.5" />
      <span>Đã hết lượt hỏi hôm nay</span>
    </div>
  )
}

export default AiQuotaBadge
