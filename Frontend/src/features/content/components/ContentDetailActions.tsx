import { Link } from 'react-router'
import { AlertTriangle, BookOpen, Check, Play, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ContentDetailData } from '@/types/content'

interface ContentDetailActionsProps {
  content: ContentDetailData
  firstChapter?: ContentDetailData['chapters'][number]
  lastReadChapter: ContentDetailData['chapters'][number] | null
  isReader: boolean
  copied: boolean
  readPath: (chapterId: string) => string
  onShare: () => void
  onReport: () => void
}

export function ContentDetailActions({
  content,
  firstChapter,
  lastReadChapter,
  isReader,
  copied,
  readPath,
  onShare,
  onReport,
}: ContentDetailActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
      {lastReadChapter ? (
        <>
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600 px-6 font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            <Link to={readPath(lastReadChapter.id)}>
              <Play className="mr-2 h-4 w-4 fill-current" /> Tiếp tục đọc (Ch. {lastReadChapter.number})
            </Link>
          </Button>

          {firstChapter && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-white/15 bg-white/5 px-4 font-medium text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <Link to={readPath(firstChapter.id)}>
                <BookOpen className="mr-2 h-4 w-4" /> Đọc từ đầu (Ch. {firstChapter.number})
              </Link>
            </Button>
          )}
        </>
      ) : firstChapter ? (
        <Button
          asChild
          size="lg"
          className="rounded-xl bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600 px-7 font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
        >
          <Link to={readPath(firstChapter.id)}>
            <BookOpen className="mr-2 h-4 w-4" /> Đọc từ đầu (Ch. {firstChapter.number})
          </Link>
        </Button>
      ) : null}
      {content.type === 'Novel' && isReader && (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
        >
          <Link to={`/assistant/${content.id}`}>
            <Sparkles className="mr-2 h-4 w-4" /> Hỏi trợ lý Novel
          </Link>
        </Button>
      )}

      <button
        type="button"
        onClick={onShare}
        aria-label="Chia sẻ tác phẩm"
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">Đã chép link!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 text-slate-400" />
            <span>Chia sẻ</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onReport}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/15 active:scale-95"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Báo cáo</span>
      </button>
    </div>
  )
}
