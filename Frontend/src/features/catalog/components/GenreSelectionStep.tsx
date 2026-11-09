import {
  BookOpen,
  Coffee,
  Compass,
  Flame,
  Ghost,
  Heart,
  Rocket,
  Scroll,
  Search,
  Smile,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Genre } from '@/types/content'

interface GenreMeta {
  icon: typeof Sparkles
  description: string
}

const GENRE_METADATA: Record<string, GenreMeta> = {
  Action: { icon: Zap, description: 'Hành động kịch tính, chiến đấu' },
  Fantasy: { icon: Wand2, description: 'Thế giới phép thuật, huyền bí' },
  Historical: { icon: Scroll, description: 'Bối cảnh lịch sử, cổ trang' },
  Horror: { icon: Ghost, description: 'Kinh dị, giật gân, siêu nhiên' },
  Isekai: { icon: Compass, description: 'Chuyển sinh, xuyên không' },
  Mystery: { icon: Search, description: 'Trinh thám, giải mã bí ẩn' },
  Romance: { icon: Heart, description: 'Tình cảm đôi lứa, lãng mạn' },
  Thriller: { icon: Flame, description: 'Hồi hộp, kịch tính tâm lý' },
  Comedy: { icon: Smile, description: 'Hài hước, giải trí nhẹ nhàng' },
  Adventure: { icon: Compass, description: 'Phiêu lưu, thám hiểm' },
  'Sci-Fi': { icon: Rocket, description: 'Khoa học viễn tưởng, tương lai' },
  'Slice of Life': { icon: Coffee, description: 'Đời thường, nhẹ nhàng' },
}

const getGenreMeta = (name: string): GenreMeta =>
  GENRE_METADATA[name] ?? { icon: BookOpen, description: 'Nội dung chọn lọc' }

interface GenreSelectionStepProps {
  genres?: Genre[]
  selectedGenreIds: string[]
  isLoading: boolean
  isError: boolean
  onToggleGenre: (genreId: string) => void
  onClear: () => void
  onRetry: () => void
}

export function GenreSelectionStep({
  genres,
  selectedGenreIds,
  isLoading,
  isError,
  onToggleGenre,
  onClear,
  onRetry,
}: GenreSelectionStepProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Bước cuối cùng · Cá nhân hóa trang chủ
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Bạn thích đọc thể loại nào nhất?
        </h1>
        <p className="mx-auto max-w-lg text-xs text-muted-foreground sm:text-sm">
          Chọn từ <span className="font-semibold text-white">3 đến 5 thể loại</span> để NovaManga đề xuất
          các bộ truyện phù hợp nhất với gu của bạn trên trang chủ.
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold ${
              selectedGenreIds.length >= 3
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-white/10 bg-white/5 text-muted-foreground'
            }`}
          >
            <span>
              Đã chọn: <strong className="text-white">{selectedGenreIds.length}</strong> / 5
            </span>
            {selectedGenreIds.length < 3 && (
              <span className="text-[11px] text-amber-400">
                (chọn thêm ít nhất {3 - selectedGenreIds.length})
              </span>
            )}
          </div>

          {selectedGenreIds.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer text-xs text-muted-foreground underline underline-offset-4 hover:text-white"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      </div>

      <div className="pt-2">
        {isLoading && (
          <p className="py-12 text-center text-xs text-muted-foreground">
            Đang tải danh sách thể loại từ hệ thống...
          </p>
        )}

        {isError && (
          <div className="space-y-2 py-8 text-center">
            <p className="text-xs text-rose-400">Không thể tải danh sách thể loại.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        )}

        {genres && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {genres.map((genre) => {
              const selected = selectedGenreIds.includes(genre.id)
              const meta = getGenreMeta(genre.name)
              const GenreIcon = meta.icon

              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => onToggleGenre(genre.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    selected
                      ? 'border-primary bg-primary/10 text-white shadow-sm'
                      : 'border-white/10 bg-[#131b26] text-muted-foreground hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      selected ? 'bg-primary text-[#0b0f17]' : 'bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <GenreIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{genre.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
