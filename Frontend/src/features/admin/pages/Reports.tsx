import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { cn } from '@/lib/utils'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import {
  reportService,
  type ReportStatus,
} from '@/services/report.service'
import { ReportDetailPanel } from '@/features/admin/components/ReportDetailPanel'

const statusFilters: Array<{ label: string; value?: ReportStatus }> = [
  { label: 'Tất cả' },
  { label: 'Chờ xử lý', value: 'Pending' },
  { label: 'Đã giải quyết', value: 'Resolved' },
  { label: 'Đã bỏ qua', value: 'Dismissed' },
]

const statusLabels: Record<ReportStatus, string> = {
  Pending: 'Chờ xử lý',
  Resolved: 'Đã giải quyết',
  Dismissed: 'Đã bỏ qua',
}

const targetTypeLabels = {
  Content: 'Truyện',
  Chapter: 'Chapter',
  Comment: 'Bình luận',
  User: 'Người dùng',
} as const

export function Reports() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>()
  const [page, setPage] = useState(1)
  const [selectedReportId, setSelectedReportId] = useState<string>()
  const PAGE_SIZE = 20

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => (await reportService.getAllReports(statusFilter)).data,
  })
  const reports = reportsQuery.data ?? []

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedReports = reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedReportId(undefined)
      return
    }

    const selectedReportStillVisible = reports.some(
      (report) => report.id === selectedReportId,
    )
    if (!selectedReportStillVisible) {
      setSelectedReportId(reports[0].id)
    }
  }, [reports, selectedReportId])

  const selectedReportQuery = useQuery({
    queryKey: ['admin-report', selectedReportId],
    queryFn: async () => (await reportService.getReportById(selectedReportId!)).data,
    enabled: !!selectedReportId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (action: 'dismiss' | 'resolve') => {
      if (!selectedReportId) {
        throw new Error('Chưa chọn báo cáo cần xử lý')
      }
      return action === 'resolve'
        ? reportService.resolveReport(selectedReportId)
        : reportService.dismissReport(selectedReportId)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-report', selectedReportId] }),
      ])
    },
  })

  const report = selectedReportQuery.data

  const confirmReportAction = async (action: 'dismiss' | 'resolve') => {
    if (!report) return
    const resolved = action === 'resolve'
    const confirmed = await confirm({
      title: resolved ? 'Xác nhận giải quyết báo cáo' : 'Xác nhận bỏ qua báo cáo',
      description: `${resolved ? 'Đánh dấu đã giải quyết' : 'Bỏ qua'} báo cáo về ${targetTypeLabels[report.targetType].toLowerCase()} này?`,
      confirmLabel: resolved ? 'Đã giải quyết' : 'Bỏ qua báo cáo',
      tone: resolved ? 'default' : 'destructive',
    })
    if (confirmed) updateStatusMutation.mutate(action)
  }

  const pendingCount = reports.filter((r) => r.status === 'Pending').length

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Báo Cáo Vi Phạm</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Xử lý các nội dung, bình luận hoặc tài khoản bị người dùng báo cáo vi phạm tiêu chuẩn cộng đồng.
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

      {/* 2. FILTER PILLS */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#131b26] p-1.5">
        {statusFilters.map((filter) => {
          const isActive = statusFilter === filter.value
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white',
              )}
            >
              {filter.label}
              {filter.value === 'Pending' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. SPLIT WORKSPACE CONTAINER */}
      <div className="flex min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
        {/* Left List */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-[#0b0f17]/40 sm:w-96">
          <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hàng đợi báo cáo ({reports.length})
            </h2>
          </div>

          {reportsQuery.isLoading && (
            <p className="p-4 text-sm text-muted-foreground">Đang tải danh sách báo cáo...</p>
          )}

          {reportsQuery.isError && (
            <div className="space-y-2 p-4">
              <p className="text-sm text-destructive">Không tải được danh sách báo cáo.</p>
              <Button size="sm" variant="outline" onClick={() => reportsQuery.refetch()} className="rounded-xl">
                Thử lại
              </Button>
            </div>
          )}

          {!reportsQuery.isLoading && !reportsQuery.isError && reports.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Không có báo cáo nào trong mục này.
            </div>
          )}

          <div className="divide-y divide-white/5">
            {pagedReports.map((item) => {
              const isSelected = selectedReportId === item.id
              const isPending = item.status === 'Pending'
              const isResolved = item.status === 'Resolved'

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReportId(item.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors',
                    isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/[0.03]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-white">
                      {item.reporter?.username ?? item.reporterId}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-300 font-medium">{item.reason}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      {targetTypeLabels[item.targetType]}
                    </span>

                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        isPending && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                        isResolved && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                        !isPending && !isResolved && 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                      )}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {!reportsQuery.isLoading && !reportsQuery.isError && reports.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-slate-400">
              <span>
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, reports.length)} / {reports.length}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl border-white/10" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                  Trước
                </Button>
                <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                <Button type="button" variant="outline" size="sm" className="rounded-xl border-white/10" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Right Detail Pane */}
        <section className="min-w-0 flex-1 overflow-y-auto p-6">
          <ReportDetailPanel
            report={report}
            isLoading={Boolean(selectedReportId) && selectedReportQuery.isLoading}
            isError={Boolean(selectedReportId) && selectedReportQuery.isError}
            isUpdating={updateStatusMutation.isPending}
            targetTypeLabel={report ? targetTypeLabels[report.targetType] : ''}
            statusLabels={statusLabels}
            onRetry={() => void selectedReportQuery.refetch()}
            onAction={(action) => void confirmReportAction(action)}
          />
          {updateStatusMutation.isError && (
            <p className="mt-4 text-xs text-destructive" role="alert">
              Không cập nhật được trạng thái. Vui lòng thử lại.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default Reports
