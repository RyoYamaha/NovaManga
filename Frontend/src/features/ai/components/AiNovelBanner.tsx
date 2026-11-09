import { Sparkles, Bot, ChevronRight, MessageSquare, BookOpen, Layers } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface Props {
  novelId: string
  novelTitle: string
  genres?: string[]
  chapterCount?: number
  freeChapters?: number
}

const SAMPLE_PROMPTS = [
  { icon: BookOpen, text: 'Tóm tắt nội dung chính & thể loại của bộ này' },
  { icon: Layers, text: 'Truyện có bao nhiêu chương, đọc thử thế nào?' },
  { icon: Sparkles, text: 'Gợi ý những bộ tiểu thuyết có phong cách tương tự' },
]

export function AiNovelBanner({
  novelId,
  novelTitle,
  genres = [],
  chapterCount,
  freeChapters,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#202d3d] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Nova AI Assistant
              </span>
              <span className="text-xs text-muted-foreground">Hỗ trợ tra cứu Novel</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white">
              Có thắc mắc về &ldquo;{novelTitle}&rdquo;?
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Trợ lý AI sẵn sàng giải đáp thông tin số chương ({chapterCount ?? 0} chương
              {freeChapters ? `, ${freeChapters} chương miễn phí` : ''}), thể loại ({genres.slice(0, 3).join(', ')}), và gợi ý truyện tương tự mà không tiết lộ spoiler!
            </p>
          </div>
        </div>

        <Button
          asChild
          className="shrink-0 gap-2 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Link to={`/assistant/${novelId}`}>
            <MessageSquare className="h-4 w-4" />
            <span>Hỏi Trợ lý AI</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Quick Prompts shortcuts */}
      <div className="relative mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mr-1">
          Câu hỏi nhanh:
        </span>
        {SAMPLE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon
          return (
            <Link
              key={index}
              to={`/assistant/${novelId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-white"
            >
              <Icon className="h-3 w-3 text-primary" />
              <span>{prompt.text}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AiNovelBanner
