import { CheckCircle2, Flag, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Report, ReportStatus } from '@/services/report.service'

interface ReportDetailPanelProps {
  report?: Report
  isLoading: boolean
  isError: boolean
  isUpdating: boolean
  targetTypeLabel: string
  statusLabels: Record<ReportStatus, string>
  onRetry: () => void
  onAction: (action: 'dismiss' | 'resolve') => void
}

export function ReportDetailPanel({
  report,
  isLoading,
  isError,
  isUpdating,
  targetTypeLabel,
  statusLabels,
  onRetry,
  onAction,
}: ReportDetailPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải chi tiết báo cáo...</p>
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Không tải được chi tiết báo cáo.</p>
        <Button size="sm" variant="outline" onClick={onRetry} className="rounded-xl">
          Thử lại
        </Button>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Flag className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-semibold">Chọn một báo cáo ở danh sách bên trái để kiểm tra chi tiết.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Báo cáo {targetTypeLabel.toLowerCase()}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Thời gian gửi: {new Date(report.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            report.status === 'Pending' && 'border-amber-500/20 bg-amber-500/10 text-amber-400',
            report.status === 'Resolved' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
            report.status === 'Dismissed' && 'border-slate-500/20 bg-slate-500/10 text-slate-400',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              report.status === 'Pending' && 'bg-amber-400',
              report.status === 'Resolved' && 'bg-emerald-400',
              report.status === 'Dismissed' && 'bg-slate-400',
            )}
          />
          {statusLabels[report.status]}
        </span>
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-[#0b0f17] p-4 sm:grid-cols-2">
        <div>
          <span className="text-xs font-semibold text-muted-foreground">Người gửi báo cáo</span>
          <p className="mt-1 font-bold text-white">{report.reporter?.username ?? report.reporterId}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-muted-foreground">Đối tượng bị báo cáo</span>
          <p className="mt-1 font-bold text-primary">
            {targetTypeLabel} (ID: {report.targetId})
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lý do vi phạm</h3>
        <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-sm leading-relaxed text-slate-200">
          {report.reason}
        </div>
      </div>

      {report.evidence && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bằng chứng kèm theo
          </h3>
          <div className="break-all rounded-xl border border-white/10 bg-[#0b0f17] p-4 font-mono text-xs text-slate-300">
            {report.evidence}
          </div>
        </div>
      )}

      {report.status === 'Pending' && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
          <Button
            variant="outline"
            disabled={isUpdating}
            onClick={() => onAction('dismiss')}
            className="rounded-xl border-white/10 text-slate-300 hover:text-white"
          >
            <XCircle className="mr-1.5 h-4 w-4" /> Bỏ qua báo cáo
          </Button>
          <Button
            disabled={isUpdating}
            onClick={() => onAction('resolve')}
            className="rounded-xl bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-600"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Đánh dấu đã giải quyết
          </Button>
        </div>
      )}

      {isUpdating && (
        <p className="text-xs text-muted-foreground" role="status">Đang cập nhật trạng thái...</p>
      )}
    </div>
  )
}
