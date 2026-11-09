import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, ClipboardList, Clock, RefreshCw } from 'lucide-react'
import { reportService } from '@/services/report.service'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusLabels = {
  Pending: 'Đang chờ xem xét',
  Resolved: 'Đã giải quyết',
  Dismissed: 'Đã đóng',
} as const

const targetTypeLabels = {
  Content: 'Truyện',
  Chapter: 'Chapter',
  Comment: 'Bình luận',
  User: 'Người dùng',
} as const

export function MyReports() {
  const reportsQuery = useQuery({
    queryKey: ['my-reports'],
    queryFn: async () => (await reportService.getMyReports()).data,
  })

  const list = reportsQuery.data ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Báo Cáo Của Tôi</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi tiến độ và phản hồi từ Ban Quản Trị đối với các báo cáo vi phạm bạn đã gửi.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => reportsQuery.refetch()}
          className="rounded-xl border-white/10"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${reportsQuery.isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* 2. CONTENT */}
      {reportsQuery.isLoading && (
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Đang tải danh sách báo cáo...
        </div>
      )}

      {reportsQuery.isError && (
        <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-semibold text-destructive">Không tải được báo cáo của bạn.</p>
          <Button size="sm" variant="outline" onClick={() => reportsQuery.refetch()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      )}

      {!reportsQuery.isLoading && !reportsQuery.isError && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 p-16 text-center text-muted-foreground space-y-3">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-white">Bạn chưa gửi báo cáo nào</p>
          <p className="text-xs max-w-sm mx-auto">
            Khi phát hiện các nội dung dịch thô, nội dung kích dục, lăng mạ hoặc vi phạm bản quyền, hãy sử dụng nút Báo cáo để thông báo cho Admin.
          </p>
        </div>
      )}

      {!reportsQuery.isLoading && !reportsQuery.isError && list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
          <div className="divide-y divide-white/5">
            {list.map((report) => {
              const isPending = report.status === 'Pending'
              const isResolved = report.status === 'Resolved'

              return (
                <div key={report.id} className="p-5 transition-colors hover:bg-white/[0.02] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        Báo cáo {targetTypeLabels[report.targetType].toLowerCase()}
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Mã đối tượng: {report.targetId.slice(0, 10)}...
                      </span>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                        isPending && 'border-amber-500/20 bg-amber-500/10 text-amber-400',
                        isResolved && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
                        !isPending && !isResolved && 'border-slate-500/20 bg-slate-500/10 text-slate-400',
                      )}
                    >
                      {isPending ? (
                        <Clock className="h-3 w-3" />
                      ) : isResolved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {statusLabels[report.status]}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#0b0f17] p-3.5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    <span className="font-bold text-slate-400 block mb-1">Nội dung lý do bạn đã gửi:</span>
                    {report.reason}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Thời gian gửi: {new Date(report.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyReports
