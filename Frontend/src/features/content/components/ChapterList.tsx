import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Grid,
  Layers,
  List,
  Play,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Chapter } from '@/types/chapter'
import type { ContentType } from '@/types/content'

interface ChapterListProps {
  chapters: Chapter[]
  completedChapterIds: Set<string>
  lastChapterId?: string | null
  contentId: string
  contentType: ContentType
}

function isNewChapter(publishedAt?: string | null, createdAt?: string) {
  const dateStr = publishedAt || createdAt
  if (!dateStr) return false
  const diffDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

export function ChapterList({
  chapters,
  completedChapterIds,
  lastChapterId,
  contentId,
  contentType,
}: ChapterListProps) {
  const [sortDescending, setSortDescending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const filteredChapters = useMemo(() => {
    const sorted = [...chapters].sort((a, b) =>
      sortDescending ? b.number - a.number : a.number - b.number,
    )
    const query = searchQuery.toLowerCase().trim()
    if (!query) return sorted
    return sorted.filter((chapter) => {
      const numberMatches =
        `chương ${chapter.number}`.includes(query) || `${chapter.number}` === query
      const titleMatches = chapter.title?.toLowerCase().includes(query) ?? false
      return numberMatches || titleMatches
    })
  }, [chapters, searchQuery, sortDescending])

  const readPath = (chapterId: string) =>
    `/content/${contentId}/${contentType === 'Manga' ? 'read-manga' : 'read-novel'}/${chapterId}`

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#1a2330]/80 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Danh sách chương</h2>
            <p className="text-xs text-slate-400">
              Tổng cộng {chapters.length} chương đã phát hành
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDescending((previous) => !previous)}
            className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {sortDescending ? 'Mới nhất trước' : 'Cũ nhất trước'}
          </Button>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Xem dạng danh sách"
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Xem dạng lưới số"
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {chapters.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm kiếm theo số chương (VD: 1, 2) hoặc tên chương..."
            className="w-full rounded-2xl border border-white/10 bg-[#151c26] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Xóa
            </button>
          )}
        </div>
      )}

      {chapters.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <Layers className="mx-auto h-10 w-10 text-slate-600 mb-2" />
          Chưa có chương nào được phát hành cho tác phẩm này.
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy chương nào khớp với từ khóa "{searchQuery}".
        </div>
      ) : viewMode === 'list' ? (
        <div className="max-h-[580px] overflow-y-auto rounded-2xl border border-white/10 bg-[#151d27] divide-y divide-white/5 scrollbar-thin">
          {filteredChapters.map((chapter) => {
            const isRead = completedChapterIds.has(chapter.id)
            const isCurrentRead = lastChapterId === chapter.id
            const isNew = isNewChapter(chapter.publishedAt, chapter.createdAt)

            return (
              <Link
                key={chapter.id}
                to={readPath(chapter.id)}
                className={`group flex items-center justify-between gap-4 px-4 py-3.5 text-sm transition-all duration-150 ${
                  isCurrentRead
                    ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
                    : isRead
                      ? 'bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {isCurrentRead ? (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px]" title="Đang đọc dở">
                      <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
                    </div>
                  ) : isRead ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Đã đọc" />
                  ) : (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-slate-600 group-hover:bg-primary transition-colors" />
                  )}

                  <div className="min-w-0 flex items-center gap-2">
                    <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-300 group-hover:text-primary transition-colors">
                      Ch. {chapter.number}
                    </span>
                    <span className="truncate font-medium text-slate-200 group-hover:text-white transition-colors">
                      {chapter.title || `Chương ${chapter.number}`}
                    </span>
                  </div>

                  {isNew && (
                    <span className="shrink-0 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                      MỚI
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  {(chapter.publishedAt || chapter.createdAt) && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(chapter.publishedAt ?? chapter.createdAt!).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    <span>Đọc</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="max-h-[580px] overflow-y-auto rounded-2xl border border-white/10 bg-[#151d27] p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
            {filteredChapters.map((chapter) => {
              const isRead = completedChapterIds.has(chapter.id)
              const isCurrentRead = lastChapterId === chapter.id

              return (
                <Link
                  key={chapter.id}
                  to={readPath(chapter.id)}
                  className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
                    isCurrentRead
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10'
                      : isRead
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-primary/50 hover:bg-primary/10 hover:text-white'
                  }`}
                  title={chapter.title || `Chương ${chapter.number}`}
                >
                  <span className="text-xs font-bold">Ch. {chapter.number}</span>
                  {isCurrentRead ? (
                    <span className="text-[9px] text-amber-400 font-semibold">Đang đọc</span>
                  ) : isRead ? (
                    <span className="text-[9px] text-emerald-400">Đã đọc</span>
                  ) : (
                    <span className="text-[9px] text-slate-500 group-hover:text-primary">Đọc</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
