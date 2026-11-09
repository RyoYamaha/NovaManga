import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Clock,
  Layers,
  Building2,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { PendingPublisherReviewList } from '@/features/admin/components/PendingPublisherReviewList'
import { UnpublishedContentTable } from '@/features/admin/components/UnpublishedContentTable'
import { adminService } from '@/features/admin/api/admin.service'
import { Button } from '@/components/ui/button'
import type { ContentListItem } from '@/types/content'
import { useAppDialog } from '@/components/common/AppDialogProvider'

type Tab = 'content' | 'publisher'

export function ReviewQueue() {
  const qc = useQueryClient()
  const { confirm } = useAppDialog()
  const [tab, setTab] = useState<Tab>('content')
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const {
    data,
    isLoading: isQueueLoading,
    isError: isQueueError,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['admin-review-queue'],
    queryFn: adminService.getReviewQueue,
  })

  const {
    data: allContents = [],
    isLoading: isContentsLoading,
    isError: isContentsError,
    refetch: refetchContents,
  } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminService.getAllContents,
  })

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-review-queue'] })
      qc.invalidateQueries({ queryKey: ['admin-content'] })
      qc.invalidateQueries({ queryKey: ['contents'] })
      qc.invalidateQueries({ queryKey: ['content'] })
      qc.invalidateQueries({ queryKey: ['admin-content-detail'] })
    },
    onError: () => setError('Thao tác thất bại. Mục này có thể đã được xử lý, hãy tải lại.'),
  })

  const confirmAction = async (
    title: string,
    description: string,
    confirmLabel: string,
    fn: () => Promise<unknown>,
    tone: 'default' | 'destructive' = 'default',
  ) => {
    if (await confirm({ title, description, confirmLabel, tone })) act.mutate(fn)
  }

  // Lọc các truyện chưa xuất bản
  const unPublishedContents = useMemo(() => {
    return allContents.filter((item: ContentListItem) => item.publicationStatus !== 'Published')
  }, [allContents])

  // Lọc theo search, status, type
  const filteredContents = useMemo(() => {
    return unPublishedContents.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.uploader?.username && c.uploader.username.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'ALL' || c.publicationStatus === statusFilter
      const matchType = typeFilter === 'ALL' || c.type === typeFilter

      return matchSearch && matchStatus && matchType
    })
  }, [unPublishedContents, searchQuery, statusFilter, typeFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredContents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedContents = filteredContents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const publishers = data?.pendingPublisher ?? []
  const isLoading = isQueueLoading || isContentsLoading
  const isError = isQueueError || isContentsError

  // Đếm nhanh
  const pendingApprovalCount = unPublishedContents.filter(
    (c) => c.publicationStatus === 'PendingApproval',
  ).length
  const hiddenCount = unPublishedContents.filter((c) => c.publicationStatus === 'Hidden').length
  const rejectedCount = unPublishedContents.filter((c) => c.publicationStatus === 'Rejected').length

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Khu vực kiểm duyệt quản trị</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Truyện chưa xuất bản
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Quản lý các tác phẩm chờ duyệt, bị tạm ẩn hoặc từ chối. Kết quả AI hiển thị ngay trong danh sách và hồ sơ để tham khảo khi duyệt.
          </p>
        </div>

        {/* Nút làm mới */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchQueue()
            refetchContents()
          }}
          className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#161e29] to-transparent p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Chờ phê duyệt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{pendingApprovalCount}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Cần admin xem xét và phê duyệt</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#161e29]/90 p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Đang ẩn / Bị từ chối</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{hiddenCount + rejectedCount}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{hiddenCount} tạm ẩn · {rejectedCount} từ chối</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-[#161e29] to-transparent p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400">Publisher chờ xác minh</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{publishers.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Hồ sơ nhà xuất bản cần thẩm định</p>
        </div>
      </div>

      {/* 3. TABS SELECTOR */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('content')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            tab === 'content'
              ? 'bg-primary text-slate-950 shadow-md shadow-primary/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tác phẩm chưa xuất bản</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              tab === 'content' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
            }`}
          >
            {unPublishedContents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('publisher')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            tab === 'publisher'
              ? 'bg-primary text-slate-950 shadow-md shadow-primary/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Publisher cần duyệt</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              tab === 'publisher' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
            }`}
          >
            {publishers.length}
          </span>
        </button>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: DANH SÁCH TRUYỆN CHƯA XUẤT BẢN */}
      {tab === 'content' && (
        <div className="space-y-4">
          {/* Toolbar Tìm kiếm & Bộ lọc */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên tác phẩm, người đăng..."
                className="w-full rounded-2xl border border-white/10 bg-[#161e29] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PendingApproval">Chờ phê duyệt</option>
                <option value="Hidden">Đang tạm ẩn</option>
                <option value="Rejected">Bị từ chối</option>
                <option value="Draft">Bản nháp</option>
              </select>

              {/* Lọc Loại truyện */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Lọc theo loại truyện"
                className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả định dạng</option>
                <option value="Manga">Manga</option>
                <option value="Novel">Novel</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#161e29]/60 p-12 text-center text-sm text-slate-400 backdrop-blur-xl">
              <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
              Đang tải danh sách tác phẩm...
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
              Không thể tải dữ liệu kiểm duyệt. Vui lòng thử lại.
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#161e29]/40 p-12 text-center text-slate-400 backdrop-blur-xl">
              <FileCheck2 className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Không có tác phẩm nào phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Hiện tại không có truyện nào cần xử lý trong mục này'}
              </p>
            </div>
          ) : (
            <UnpublishedContentTable
              contents={pagedContents}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredContents.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {/* TAB 2: PUBLISHER CHỜ XÁC MINH */}
      {tab === 'publisher' && (
        <div className="space-y-4">
          <PendingPublisherReviewList
            publishers={publishers}
            isPending={act.isPending}
            onApprove={(publisher) =>
              void confirmAction(
                'Xác nhận duyệt Publisher',
                `Xác minh và cấp quyền chính thức cho Publisher "${publisher.organizationName}"?`,
                'Duyệt Publisher',
                () => adminService.verifyPublisher(publisher.id),
              )
            }
            onReject={(publisher) =>
              void confirmAction(
                'Xác nhận từ chối Publisher',
                `Từ chối hồ sơ đăng ký của "${publisher.organizationName}"?`,
                'Từ chối',
                () => adminService.rejectPublisher(publisher.id),
                'destructive',
              )
            }
          />
        </div>
      )}
    </div>
  )
}

export default ReviewQueue
