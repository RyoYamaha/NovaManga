import { Link } from 'react-router'
import { AlertCircle, History, Loader2, Sparkles } from 'lucide-react'
import { ContentCard } from '@/components/content/ContentCard'
import { Button } from '@/components/ui/button'
import type { RecommendedContentPaginationResponse } from '@/types/content'
import type { ReadingHistoryItem } from '@/services/reading-progress.service'

interface ContinueReadingRailProps {
  history: ReadingHistoryItem[]
}

export function ContinueReadingRail({ history }: ContinueReadingRailProps) {
  if (!history.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold sm:text-xl">Lịch sử đọc</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Link to="/history">Xem lịch sử</Link>
        </Button>
      </div>

      <div className="-mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-2 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
        {history.slice(0, 10).map((item) => {
          const readUrl = `/content/${item.content.id}/${
            item.content.type === 'Manga' ? 'read-manga' : 'read-novel'
          }/${item.lastChapter.id}`

          return (
            <Link
              key={item.contentId}
              to={readUrl}
              className="group relative aspect-[3/4] w-32 shrink-0 snap-start overflow-hidden rounded-lg border border-white/10 bg-card sm:w-36"
            >
              {item.content.coverImageUrl ? (
                <img
                  src={item.content.coverImageUrl}
                  alt={item.content.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {item.content.type}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-8">
                <p className="line-clamp-2 text-xs font-semibold leading-snug text-white">
                  {item.content.title}
                </p>
                <p className="mt-1 truncate text-[10px] text-slate-300">
                  Ch. {item.lastChapter.number}
                  {item.lastChapter.title ? ` · ${item.lastChapter.title}` : ''}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

interface RecommendationsRailProps {
  recommendations?: RecommendedContentPaginationResponse
  isLoading: boolean
  isError: boolean
}

export function RecommendationsRail({
  recommendations,
  isLoading,
  isError,
}: RecommendationsRailProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gợi ý dành riêng cho bạn</h2>
            <p className="text-xs text-muted-foreground">
              {recommendations?.fallback
                ? 'Dựa trên xu hướng đọc, đánh giá và tác phẩm mới'
                : 'Dựa trên thể loại, lịch sử đọc, yêu thích và thẻ truyện'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="rounded-xl border-white/10 text-xs"
        >
          <Link to="/settings/preferences">Tùy chỉnh sở thích</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang cá nhân hóa nội dung...
        </div>
      )}

      {isError && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Không thể tải gợi ý lúc này.
        </p>
      )}

      {!isLoading && !isError && recommendations?.items.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Chưa có gợi ý phù hợp. Khám phá các truyện đang thịnh hành phía dưới.
        </p>
      )}

      {!!recommendations?.items.length && (
        <div
          aria-label="Danh sách truyện được đề xuất"
          className="-mx-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-3 pb-3 sm:-mx-6 sm:px-6"
          tabIndex={0}
        >
          {recommendations.items.map((item) => (
            <div
              key={item.id}
              className="flex w-[42%] min-w-[140px] max-w-[190px] shrink-0 snap-start flex-col sm:w-[30%] md:w-[22%] lg:w-[16%]"
            >
              <ContentCard content={item} />
              <span className="mt-1 px-1 text-[11px] font-medium text-purple-300/80">
                {item.matchingGenres || item.matchingTags
                  ? `✨ ${item.matchingGenres} thể loại · ${item.matchingTags} thẻ phù hợp`
                  : `🔥 ${item.activeReaders} người đọc gần đây`}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
