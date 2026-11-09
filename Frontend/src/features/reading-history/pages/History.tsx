import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { readingProgressService, type ReadingHistoryItem } from '@/services/reading-progress.service'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { Input } from '@/components/ui/input'
import { ArrowRight, Clock, Compass, History as HistoryIcon, ImageOff, Search } from 'lucide-react'

const FILTERS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Manga', label: 'Truyện tranh (Manga)' },
  { id: 'Novel', label: 'Tiểu thuyết (Novel)' },
] as const

type HistoryFilter = (typeof FILTERS)[number]['id']

function getReaderPath(item: ReadingHistoryItem) {
  const reader = item.content.type === 'Manga' ? 'read-manga' : 'read-novel'
  return `/content/${item.content.id}/${reader}/${item.lastChapter.id}`
}

function formatReadDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function History() {
  const user = useAuthStore((state) => state.user)
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reading-progress', 'history'],
    enabled: user?.role === 'Reader',
    queryFn: async () => (await readingProgressService.getMyHistory()).data,
  })

  const historyList = data ?? []

  const filteredHistory = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
    return historyList.filter((item) => {
      const matchesType = activeFilter === 'All' || item.content.type === activeFilter
      const matchesTitle = item.content.title.toLocaleLowerCase().includes(normalizedQuery)
      return matchesType && matchesTitle
    })
  }, [activeFilter, historyList, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / 20))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredHistory.slice((currentPage - 1) * 20, currentPage * 20)

  useEffect(() => {
    setPage(1)
  }, [activeFilter, searchQuery])

  if (user?.role !== 'Reader') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Lịch Sử Đọc Truyện</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi tiến trình đọc các chương truyện bạn đã khám phá gần đây.
            </p>
          </div>
        </div>

        <Button asChild size="sm" className="rounded-xl font-bold">
          <Link to="/">
            <Compass className="mr-1.5 h-3.5 w-3.5" /> Khám phá thêm truyện
          </Link>
        </Button>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-[#0b0f17] p-1 border border-white/5">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm tên tác phẩm..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 rounded-xl border-white/10 bg-[#0b0f17] pl-8 text-xs placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* 3. LIST */}
      {isLoading && (
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Đang tải lịch sử đọc...
        </div>
      )}

      {isError && (
        <div className="py-12 text-center space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive">Không tải được lịch sử đọc.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredHistory.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 py-16 text-center text-muted-foreground space-y-3">
          <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-white">
            {searchQuery ? 'Không tìm thấy truyện phù hợp.' : 'Bạn chưa có lịch sử đọc truyện nào.'}
          </p>
          <p className="text-xs max-w-sm mx-auto">
            Hệ thống sẽ tự động lưu lại chương và trang bạn đang đọc dở để bạn có thể tiếp tục bất cứ lúc nào.
          </p>
          <Button asChild size="sm" className="mt-2 rounded-xl font-bold">
            <Link to="/">Bắt đầu đọc ngay</Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredHistory.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
            <div className="divide-y divide-white/5">
              {pageItems.map((item) => (
                <div
                  key={item.contentId}
                  className="group flex flex-col gap-4 p-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    to={`/content/${item.content.id}`}
                    className="flex items-center gap-4 min-w-0 flex-1"
                  >
                    <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17] shadow-sm">
                      {item.content.coverImageUrl ? (
                        <img
                          src={item.content.coverImageUrl}
                          alt={item.content.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-white group-hover:text-primary transition-colors truncate text-sm sm:text-base">
                        {item.content.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                          Đang đọc: {item.lastChapter.title || `Chương ${item.lastChapter.number}`}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatReadDate(item.lastReadAt)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 border-t border-white/5 sm:pt-0 sm:border-0">
                    <Button
                      asChild
                      size="sm"
                      className="rounded-xl font-bold shadow-sm shadow-primary/20"
                    >
                      <Link to={getReaderPath(item)}>
                        Đọc tiếp <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl"
              >
                Trang trước
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                <span className="text-xs text-muted-foreground">· {filteredHistory.length} truyện</span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-xl"
              >
                Trang sau
              </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default History
