import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { BookOpen, Clock, Eye, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { adminService } from '@/features/admin/api/admin.service'

const PAGE_SIZE = 20

export function ChapterReviewQueue() {
  const [page, setPage] = useState(1)
  const chaptersQuery = useQuery({
    queryKey: ['admin-pending-chapters'],
    queryFn: adminService.getPendingChapters,
  })

  const chapters = chaptersQuery.data ?? []
  const totalPages = Math.max(1, Math.ceil(chapters.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageChapters = chapters.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Kiểm duyệt nội dung</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Chapter chờ duyệt
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Các chương mới thuộc truyện đã xuất bản đang chờ Admin kiểm tra.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void chaptersQuery.refetch()}
          disabled={chaptersQuery.isFetching}
          className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${chaptersQuery.isFetching ? 'animate-spin' : ''}`}
          />
          Làm mới
        </Button>
      </div>

      {chaptersQuery.isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-[#131b26] p-12 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-2 h-7 w-7 animate-spin text-primary" />
          Đang tải danh sách chapter...
        </div>
      ) : chaptersQuery.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-semibold text-destructive">
            Không tải được danh sách chapter chờ duyệt.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void chaptersQuery.refetch()}
            className="mt-3 rounded-xl"
          >
            Thử tải lại
          </Button>
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/50 py-16 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-3 text-base font-semibold text-white">
            Hiện không có chapter nào cần duyệt
          </p>
          <p className="mt-1 text-xs">
            Chapter mới của truyện đã xuất bản sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
          <div className="divide-y divide-white/5">
            {pageChapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0">
                  <Link
                    to={`/admin/content/${chapter.contentId}`}
                    className="text-sm font-bold text-white transition-colors hover:text-primary"
                  >
                    {chapter.content.title}
                  </Link>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                    Chương {chapter.number}
                    {chapter.title ? `: ${chapter.title}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chapter.content.type} · Người đăng: {chapter.content.uploader.username}
                  </p>
                </div>

                <Link
                  to={`/admin/chapters/${chapter.id}`}
                  state={{ returnTo: '/admin/chapters/pending' }}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Eye className="h-4 w-4" />
                  Xem và duyệt
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {!chaptersQuery.isLoading && !chaptersQuery.isError && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Trang trước
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            <span className="text-xs text-muted-foreground">· {chapters.length} chapter</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  )
}

export default ChapterReviewQueue
