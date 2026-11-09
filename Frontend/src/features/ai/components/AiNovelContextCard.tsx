import { BookOpen, ExternalLink, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface Props {
  novelId?: string | null
  novelTitle?: string | null
  coverImageUrl?: string | null
  genres?: string[]
  onClear?: () => void
  compact?: boolean
}

export function AiNovelContextCard({
  novelId,
  novelTitle,
  coverImageUrl,
  genres = [],
  onClear,
  compact = false,
}: Props) {
  if (!novelId && !novelTitle) return null

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs text-primary">
        <div className="flex min-w-0 items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">Ngữ cảnh: {novelTitle || 'Tiểu thuyết'}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {novelId && (
            <Link
              to={`/content/${novelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-primary/70 hover:text-primary transition-colors"
              title="Xem trang tác phẩm"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-primary/70 hover:text-destructive transition-colors"
              title="Bỏ ngữ cảnh tác phẩm này"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3.5 overflow-hidden rounded-xl border border-white/10 bg-[#202d3d] p-3.5">
      {/* Cover / Icon */}
      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1a2533]">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={novelTitle ?? 'Tiểu thuyết'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/15 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
            Ngữ cảnh Novel
          </span>
          {genres.length > 0 && (
            <span className="text-[11px] text-muted-foreground truncate">
              {genres.slice(0, 3).join(' · ')}
            </span>
          )}
        </div>
        <h4 className="mt-1 truncate text-sm font-bold text-white">
          {novelTitle || 'Đang trao đổi về tác phẩm'}
        </h4>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          AI ưu tiên giải đáp các thông tin và câu hỏi liên quan đến bộ này.
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {novelId && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-white"
          >
            <Link to={`/content/${novelId}`} target="_blank" rel="noopener noreferrer">
              <span>Xem truyện</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
        {onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            title="Bỏ ngữ cảnh tác phẩm"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default AiNovelContextCard
