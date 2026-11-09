import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface ContentSynopsisProps {
  synopsis?: string | null
}

export function ContentSynopsis({ synopsis }: ContentSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="rounded-3xl border border-white/10 bg-[#1a2330]/80 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Giới thiệu tác phẩm</h2>
        </div>
      </div>

      <div className="relative">
        <p
          className={`whitespace-pre-line text-sm leading-relaxed text-slate-300 transition-all ${
            !isExpanded && (synopsis?.length ?? 0) > 300
              ? 'line-clamp-4 max-h-32 overflow-hidden'
              : ''
          }`}
        >
          {synopsis || 'Tác phẩm chưa có phần tóm tắt giới thiệu.'}
        </p>

        {(synopsis?.length ?? 0) > 300 && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded((previous) => !previous)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-white/10"
            >
              {isExpanded ? (
                <>
                  <span>Thu gọn</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Xem thêm</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
