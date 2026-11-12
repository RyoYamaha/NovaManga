import { Link } from 'react-router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publisherService } from '@/features/creator/api/publisher.service'
import { DeleteStoryButton } from '@/features/creator/components/DeleteStoryButton'
import { PublisherTranslationsPanel } from '@/features/creator/components/PublisherTranslationsPanel'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FilePlus,
  ImageOff,
  Languages,
  Library,
  Plus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react'

const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Published: {
    label: 'Đang phát hành',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  PendingApproval: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  Rejected: {
    label: 'Cần sửa đổi',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
  },
  Draft: {
    label: 'Bản nháp',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
  },
}

export function SeriesCatalog() {
  const { data: contents, isLoading, isError, refetch } = useQuery({
    queryKey: ['publisher-contents'],
    queryFn: () => publisherService.getMyContents().then((res) => res.data),
  })
  const [page, setPage] = useState(1)
  const [expandedTranslationSeries, setExpandedTranslationSeries] = useState<string | null>(null)
  const PAGE_SIZE = 20

  const list = contents ?? []
  const total = list.length
  const publishedCount = list.filter((c) => c.publicationStatus === 'Published').length
  const pendingCount = list.filter((c) => c.publicationStatus === 'PendingApproval').length
  const rejectedCount = list.filter((c) => c.publicationStatus === 'Rejected').length

  useEffect(() => {
    setPage(1)
  }, [list.length])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedList = useMemo(() => list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [list, currentPage])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white sm:text-3xl">Danh Mục Tác Phẩm</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Quản lý các bộ Manga & Novel thuộc bản quyền của tổ chức xuất bản.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl border-white/10">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
          </Button>
          <Button asChild size="sm" className="rounded-xl font-bold shadow-md shadow-primary/20">
            <Link to="/publisher/create">
              <Plus className="mr-1.5 h-4 w-4" /> Thêm truyện mới
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#131b26] p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">Tổng số tác phẩm</span>
          <p className="mt-2 text-2xl font-black text-white">{isLoading ? '...' : total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Đang phát hành</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{isLoading ? '...' : publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Chờ kiểm duyệt</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{isLoading ? '...' : pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">Cần chỉnh sửa</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-400">{isLoading ? '...' : rejectedCount}</p>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
        {isLoading && (
          <p className="py-14 text-center text-sm text-muted-foreground">Đang tải danh sách truyện...</p>
        )}

        {isError && (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-destructive">Không thể tải danh sách tác phẩm.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div className="rounded-2xl border-dashed py-16 text-center text-muted-foreground space-y-3">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="text-base font-semibold text-white">Chưa có tác phẩm nào</p>
            <p className="text-xs max-w-sm mx-auto">
              Bắt đầu đăng tải các bộ truyện bản quyền đầu tiên của nhà xuất bản.
            </p>
            <Button asChild size="sm" className="mt-2 rounded-xl">
              <Link to="/publisher/create">
                <Plus className="mr-1.5 h-4 w-4" /> Tạo truyện ngay
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Tác phẩm</th>
                    <th className="p-4">Phân loại</th>
                    <th className="p-4">Trạng thái phát hành</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagedList.map((item) => {
                  const isNovel = item.type === 'Novel'
                  const badge = STATUS_BADGES[item.publicationStatus] ?? {
                    label: item.publicationStatus,
                    bg: 'bg-white/5',
                    text: 'text-slate-300',
                    border: 'border-white/10',
                    dot: 'bg-slate-400',
                  }

                  return (
                    <Fragment key={item.id}>
                    <tr className="group transition-colors hover:bg-white/[0.03]">
                      {/* Cover & Title */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17] shadow-sm">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <ImageOff className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/content/${item.id}`}
                              className="font-bold text-white hover:text-primary transition-colors line-clamp-1 block"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[11px] text-slate-400">ID: {item.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-4">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isNovel
                              ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-300'
                              : 'border border-sky-400/30 bg-sky-950/60 text-sky-300'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-white/10"
                            aria-expanded={expandedTranslationSeries === item.id}
                            onClick={() =>
                              setExpandedTranslationSeries((current) =>
                                current === item.id ? null : item.id,
                              )
                            }
                          >
                            <Languages className="mr-1.5 h-3.5 w-3.5" />
                            Bản dịch
                          </Button>
                          {item.publicationStatus === 'Rejected' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white font-semibold"
                            >
                              <Link to={`/publisher/catalog/${item.id}/resubmit`}>
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Nộp lại
                              </Link>
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="rounded-xl text-slate-300 hover:text-white"
                              >
                                <Link to={`/content/${item.id}`}>
                                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Xem
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-xl border-white/10"
                              >
                                <Link to={`/publisher/content/${item.id}/edit`}>
                                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Sửa
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                asChild
                                className="rounded-xl font-semibold"
                              >
                                <Link to={`/publisher/content/${item.id}/chapters/new`}>
                                  <FilePlus className="mr-1.5 h-3.5 w-3.5" /> Đăng chapter
                                </Link>
                              </Button>
                            </>
                          )}
                          <DeleteStoryButton contentId={item.id} title={item.title} role="publisher" />
                        </div>
                      </td>
                    </tr>
                    {expandedTranslationSeries === item.id && (
                      <tr>
                        <td colSpan={4} className="px-4 pb-4">
                          <PublisherTranslationsPanel contentId={item.id} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
            <span>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, list.length)} / {list.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl border-white/10" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                Trước
              </Button>
              <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              <Button variant="outline" size="sm" className="rounded-xl border-white/10" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                Tiếp
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default SeriesCatalog
