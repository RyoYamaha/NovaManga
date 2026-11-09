import { useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReaderFont, ReaderTheme, LineSpacing, ContentWidth } from '../../types/reader.types'
import { FONT_STACKS, THEME_CONFIGS, LINE_SPACING_VALUES, CONTENT_WIDTH_CLASSES } from '../../types/reader.types'

interface NovelScrollViewProps {
  bookTitle?: string
  chapterTitle?: string
  chapterNumber?: number
  text: string
  fontSize: number
  fontFamily: ReaderFont
  theme: ReaderTheme
  lineSpacing: LineSpacing
  contentWidth: ContentWidth
  canPreviousChapter: boolean
  canNextChapter: boolean
  onPreviousChapter: () => void
  onNextChapter: () => void
  onReachEnd?: () => void
}

export function NovelScrollView({
  bookTitle,
  chapterTitle,
  chapterNumber,
  text,
  fontSize,
  fontFamily,
  theme,
  lineSpacing,
  contentWidth,
  canPreviousChapter,
  canNextChapter,
  onPreviousChapter,
  onNextChapter,
  onReachEnd,
}: NovelScrollViewProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const currentTheme = THEME_CONFIGS[theme]
  const font = FONT_STACKS[fontFamily].stack
  const lineHeight = LINE_SPACING_VALUES[lineSpacing]
  const widthClass = CONTENT_WIDTH_CLASSES[contentWidth]

  // Calculate reading stats
  const { wordCount, readingMinutes, paragraphs } = useMemo(() => {
    const normalizedText = text.normalize('NFC')
    const rawParagraphs = normalizedText.split(/\r?\n/).filter((p) => p.trim().length > 0)
    const words = normalizedText.trim().split(/\s+/).filter(Boolean)
    const count = words.length
    const minutes = Math.max(1, Math.ceil(count / 220)) // 220 words per minute average
    return {
      wordCount: count,
      readingMinutes: minutes,
      paragraphs: rawParagraphs,
    }
  }, [text])

  // Trigger completion when scrolling near bottom
  useEffect(() => {
    const endEl = endRef.current
    if (!endEl || !onReachEnd) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onReachEnd()
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(endEl)
    return () => observer.disconnect()
  }, [onReachEnd])

  return (
    <div
      className="w-full min-h-[70vh] rounded-2xl p-4 sm:p-8 md:p-12 transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.paper,
        color: currentTheme.ink,
        boxShadow: '0 4px 24px -2px rgba(0,0,0,0.2)',
      }}
    >
      <div className={`mx-auto ${widthClass}`}>
        {/* Novel & Chapter Header Info */}
        <header className="mb-10 pb-6 border-b" style={{ borderColor: currentTheme.border }}>
          {bookTitle && (
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">
              {bookTitle}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Chương {chapterNumber ?? ''}
            {chapterTitle ? `: ${chapterTitle}` : ''}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs opacity-70">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {wordCount.toLocaleString()} từ
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Khoảng {readingMinutes} phút đọc
            </span>
          </div>
        </header>

        {/* Novel Text Body */}
        <article
          className="novel-scroll-article space-y-5 text-left"
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            lineHeight,
            color: currentTheme.ink,
          }}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((para, index) => (
              <p
                key={index}
                className="leading-relaxed indent-6 whitespace-pre-wrap break-words"
              >
                {para}
              </p>
            ))
          ) : (
            <p className="text-center italic opacity-60 py-12">
              Chương này chưa có nội dung văn bản.
            </p>
          )}
        </article>

        {/* Chapter End Sentinel */}
        <div ref={endRef} className="h-6 w-full" />

        {/* Bottom Navigation */}
        <footer
          className="mt-14 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: currentTheme.border }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onPreviousChapter}
            disabled={!canPreviousChapter}
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 font-medium border"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.cardBg,
              color: currentTheme.ink,
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Chương trước
          </Button>

          <span className="text-xs opacity-60">
            Hết chương {chapterNumber ?? ''}
          </span>

          <Button
            type="button"
            variant="outline"
            onClick={onNextChapter}
            disabled={!canNextChapter}
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 font-medium border"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.cardBg,
              color: currentTheme.ink,
            }}
          >
            Chương tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </footer>
      </div>
    </div>
  )
}
