import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TransitionEvent } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import '../styles/NovelFlipBook.css'

type ReaderFont = 'sans' | 'serif' | 'mono'
type ReaderTheme = 'dark' | 'sepia' | 'black'
type FlipDirection = 'forward' | 'backward'

interface Props {
  text: string
  fontSize: number
  fontFamily: ReaderFont
  theme: ReaderTheme
  canPreviousChapter: boolean
  canNextChapter: boolean
  onPageChange: (pageIndex: number, pageCount: number) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
}

const fontStacks: Record<ReaderFont, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, monospace',
}

const readerLineHeight = 1.9

function wrapParagraph(
  paragraph: string,
  maxWidth: number,
  measureText: (text: string) => number,
) {
  if (!paragraph.trim()) return ['']

  const lines: string[] = []
  let line = ''

  for (const word of paragraph.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (measureText(candidate) <= maxWidth) {
      line = candidate
      continue
    }

    if (line) lines.push(line)
    let wordPart = ''
    for (const character of word) {
      const nextPart = wordPart + character
      if (wordPart && measureText(nextPart) > maxWidth) {
        lines.push(wordPart)
        wordPart = character
      } else {
        wordPart = nextPart
      }
    }
    line = wordPart
  }

  if (line) lines.push(line)
  return lines
}

function paginateText(text: string, width: number, height: number, font: string, fontSize: number) {
  if (width <= 0 || height <= 0) return []

  const context = document.createElement('canvas').getContext('2d')
  if (!context) return [text]

  context.font = `${fontSize}px ${font}`
  const maxLines = Math.max(1, Math.floor(height / (fontSize * readerLineHeight)))
  const lines = text.split(/\r?\n/).flatMap((paragraph, index, paragraphs) => [
    ...wrapParagraph(paragraph, width, (value) => context.measureText(value).width),
    ...(index < paragraphs.length - 1 ? [''] : []),
  ])
  const pages: string[] = []

  for (let index = 0; index < lines.length; index += maxLines) {
    pages.push(lines.slice(index, index + maxLines).join('\n'))
  }

  return pages.length > 0 ? pages : ['']
}

export function NovelFlipBook({
  text,
  fontSize,
  fontFamily,
  theme,
  canPreviousChapter,
  canNextChapter,
  onPageChange,
  onPreviousChapter,
  onNextChapter,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pendingPageRef = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pageIndex, setPageIndex] = useState(0)
  const [flipDirection, setFlipDirection] = useState<FlipDirection | null>(null)
  const font = fontStacks[fontFamily]

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const observer = new ResizeObserver(() => {
      setDimensions({ width: frame.clientWidth, height: frame.clientHeight })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const isDoublePage = dimensions.width >= 680
  const pageStep = isDoublePage ? 2 : 1
  const bookInset = 12
  const pageBoxWidth = (dimensions.width - bookInset * 2) / pageStep
  const pagePaddingX = Math.min(60, Math.max(26, pageBoxWidth * 0.085))
  const pagePaddingY = Math.min(54, Math.max(28, dimensions.height * 0.07))
  const pageFooterSpace = 34
  const pageWidth =
    pageBoxWidth - pagePaddingX * 2
  const pageHeight =
    dimensions.height - bookInset * 2 - pagePaddingY * 2 - pageFooterSpace
  const pagePadding = `${pagePaddingY}px ${pagePaddingX}px ${pagePaddingY + pageFooterSpace}px`

  const pages = useMemo(
    () => paginateText(text, pageWidth, pageHeight, font, fontSize),
    [text, pageWidth, pageHeight, font, fontSize],
  )

  const spreadStart = Math.min(
    Math.floor(pageIndex / pageStep) * pageStep,
    Math.max(0, pages.length - 1),
  )
  const visibleLastPage = Math.min(spreadStart + pageStep - 1, pages.length - 1)

  useEffect(() => {
    onPageChange(visibleLastPage, pages.length)
  }, [onPageChange, pages.length, visibleLastPage])

  const turnPage = useCallback((direction: FlipDirection) => {
    if (flipDirection || pages.length === 0) return

    const nextIndex = spreadStart + (direction === 'forward' ? pageStep : -pageStep)
    if (nextIndex < 0) {
      onPreviousChapter()
      return
    }
    if (nextIndex >= pages.length) {
      onNextChapter()
      return
    }

    pendingPageRef.current = nextIndex
    setFlipDirection(direction)
  }, [flipDirection, onNextChapter, onPreviousChapter, pageStep, pages.length, spreadStart])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        turnPage('forward')
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        turnPage('backward')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [turnPage])

  const onFlipEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !flipDirection) return
    if (pendingPageRef.current !== null) setPageIndex(pendingPageRef.current)
    pendingPageRef.current = null
    setFlipDirection(null)
  }

  const pageStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: readerLineHeight,
    fontFamily: font,
    padding: pagePadding,
  }
  const renderPage = (page: string | undefined, index: number, className: string) => (
    <div key={`${className}-${index}`} className={`novel-flipbook-page ${className}`}>
      <article className="novel-flipbook-text" style={pageStyle}>{page ?? ''}</article>
      <span className="novel-flipbook-page-number">{index + 1}</span>
    </div>
  )
  const underlayStart = spreadStart + (flipDirection === 'forward' ? pageStep : -pageStep)
  const underlayLeft = pages[underlayStart]
  const underlayRight = pages[underlayStart + 1]
  const sheetPage = flipDirection === 'forward'
    ? pages[spreadStart + pageStep - 1]
    : pages[spreadStart]
  const sheetBackPage = flipDirection === 'forward'
    ? pages[spreadStart + pageStep]
    : pages[spreadStart - 1]
  return (
    <div className="novel-flipbook-wrap">
      <div
        ref={frameRef}
        className={[
          'novel-flipbook',
          isDoublePage ? 'is-double-page' : 'is-single-page',
          `theme-${theme}`,
          flipDirection ? `is-turning-${flipDirection}` : '',
        ].filter(Boolean).join(' ')}
        role="region"
        aria-label="Nội dung chương tiểu thuyết"
      >
        <div className="novel-flipbook-underlay" aria-hidden="true">
          {isDoublePage && (
            renderPage(underlayLeft, underlayStart, 'novel-flipbook-page-left')
          )}
          {renderPage(
            isDoublePage ? underlayRight : underlayLeft,
            isDoublePage ? underlayStart + 1 : underlayStart,
            'novel-flipbook-page-right',
          )}
        </div>

        <div className="novel-flipbook-spread">
          {isDoublePage && (
            renderPage(pages[spreadStart], spreadStart, 'novel-flipbook-page-left')
          )}
          {renderPage(
            isDoublePage ? pages[spreadStart + 1] : pages[spreadStart],
            isDoublePage ? spreadStart + 1 : spreadStart,
            'novel-flipbook-page-right',
          )}
        </div>

        <div
          className={`novel-flipbook-sheet${flipDirection ? ` is-turning-${flipDirection}` : ''}`}
          onTransitionEnd={onFlipEnd}
          aria-hidden="true"
        >
          <div className="novel-flipbook-face novel-flipbook-front">
            <article className="novel-flipbook-text" style={pageStyle}>{sheetPage ?? ''}</article>
            <span className="novel-flipbook-page-number">
              {(flipDirection === 'forward' ? spreadStart + pageStep : spreadStart) + 1}
            </span>
          </div>
          <div className="novel-flipbook-face novel-flipbook-back">
            <article className="novel-flipbook-text" style={pageStyle}>{sheetBackPage ?? ''}</article>
            <span className="novel-flipbook-page-number">
              {(flipDirection === 'forward' ? spreadStart + pageStep + 1 : spreadStart) || ''}
            </span>
          </div>
        </div>
      </div>

      <div className="novel-flipbook-controls">
        <button
          type="button"
          onClick={() => turnPage('backward')}
          disabled={pages.length === 0 || (spreadStart === 0 && !canPreviousChapter)}
          aria-label="Trang trước"
          className="novel-flipbook-button"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageJumpInput
          compact
          currentPage={pageIndex + 1}
          totalPages={pages.length}
          onPageChange={(page) => {
            pendingPageRef.current = null
            setFlipDirection(null)
            setPageIndex(page - 1)
          }}
        />
        <button
          type="button"
          onClick={() => turnPage('forward')}
          disabled={pages.length === 0 || (visibleLastPage === pages.length - 1 && !canNextChapter)}
          aria-label="Trang sau"
          className="novel-flipbook-button"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
