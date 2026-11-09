import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TransitionEvent } from 'react'
import { BookOpen } from 'lucide-react'
import type { ReaderFont, ReaderTheme } from '../../types/reader.types'
import { FONT_STACKS, THEME_CONFIGS, LINE_SPACING_VALUES } from '../../types/reader.types'
import { paginateNovelText } from '../../utils/novel-pagination'
import { NovelPageNavigation } from './NovelPageNavigation'
import '../../styles/NovelFlipBook.css'

interface NovelBookSpreadProps {
  bookTitle?: string
  chapterTitle?: string
  chapterNumber?: number
  text: string
  fontSize: number
  fontFamily: ReaderFont
  theme: ReaderTheme
  lineSpacing?: 'tight' | 'normal' | 'relaxed'
  initialPage?: number
  canPreviousChapter: boolean
  canNextChapter: boolean
  onPageChange?: (pageIndex: number, pageCount: number) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
}

type FlipDirection = 'forward' | 'backward'

export function NovelBookSpread({
  bookTitle = 'Tiểu Thuyết',
  chapterTitle,
  chapterNumber,
  text,
  fontSize,
  fontFamily,
  theme,
  lineSpacing = 'normal',
  initialPage = 1,
  canPreviousChapter,
  canNextChapter,
  onPageChange,
  onPreviousChapter,
  onNextChapter,
}: NovelBookSpreadProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pendingPageRef = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pageIndex, setPageIndex] = useState(Math.max(0, initialPage - 1))
  const [flipDirection, setFlipDirection] = useState<FlipDirection | null>(null)

  const font = FONT_STACKS[fontFamily].stack
  const lineHeight = LINE_SPACING_VALUES[lineSpacing]
  const currentTheme = THEME_CONFIGS[theme]

  // ResizeObserver to adapt to container size
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        })
      }
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // Match BooksJS's 840px desktop spread breakpoint while measuring the available reader width.
  const isDoublePage = dimensions.width >= 840
  const pageStep = isDoublePage ? 2 : 1
  const bookInset = 8
  const headerHeight = 38
  const footerHeight = 36
  
  const pageBoxWidth = (dimensions.width - bookInset * 2) / pageStep
  const pagePaddingX = Math.min(52, Math.max(22, Math.floor(pageBoxWidth * 0.08)))
  const pagePaddingY = Math.min(44, Math.max(20, Math.floor(dimensions.height * 0.05)))
  
  const contentWidth = Math.max(100, pageBoxWidth - pagePaddingX * 2)
  const contentHeight = Math.max(
    100,
    dimensions.height - bookInset * 2 - pagePaddingY * 2 - headerHeight - footerHeight
  )

  const pages = useMemo(
    () => paginateNovelText(text, contentWidth, contentHeight, font, fontSize, lineHeight),
    [text, contentWidth, contentHeight, font, fontSize, lineHeight],
  )

  // Clamp the displayed page when pagination changes after a resize or font update.
  const boundedPageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1))
  const spreadStart = Math.min(
    Math.floor(boundedPageIndex / pageStep) * pageStep,
    Math.max(0, pages.length > 0 ? (Math.ceil(pages.length / pageStep) - 1) * pageStep : 0),
  )
  const visibleLastPage = Math.min(spreadStart + pageStep - 1, pages.length - 1)

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return
    onPageChange?.(visibleLastPage, pages.length)
  }, [dimensions.height, dimensions.width, onPageChange, pages.length, visibleLastPage])

  // Turn page logic (modeled from BooksJS 3D rotation)
  const turnPage = useCallback((direction: FlipDirection) => {
    if (flipDirection || pages.length === 0) return

    const nextIndex = spreadStart + (direction === 'forward' ? pageStep : -pageStep)
    if (nextIndex < 0) {
      if (canPreviousChapter) onPreviousChapter()
      return
    }

    if (nextIndex >= pages.length) {
      if (canNextChapter) onNextChapter()
      return
    }

    pendingPageRef.current = nextIndex
    setFlipDirection(direction)
  }, [canNextChapter, canPreviousChapter, flipDirection, onNextChapter, onPreviousChapter, pageStep, pages.length, spreadStart])

  // Touch gesture support
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) turnPage('forward')
    else if (diff < -50) turnPage('backward')
    touchStartX.current = null
  }

  const onFlipEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !flipDirection) return
    if (pendingPageRef.current !== null) {
      setPageIndex(pendingPageRef.current)
    }
    pendingPageRef.current = null
    setFlipDirection(null)
  }

  // Keyboard navigation
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

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        turnPage('forward')
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        turnPage('backward')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [turnPage])

  const pageTextStyle = {
    fontSize: `${fontSize}px`,
    lineHeight,
    fontFamily: font,
  }

  const displayChapterName = chapterTitle 
    ? `Chương ${chapterNumber ?? ''}: ${chapterTitle}`
    : `Chương ${chapterNumber ?? ''}`

  const renderPage = (
    content: string | undefined,
    pageNumber: number,
    isLeft: boolean,
    className = '',
  ) => {
    const pageNum = pageNumber + 1
    const isValid = content !== undefined && pageNumber < pages.length

    return (
      <div
        key={`${className}-${pageNumber}`}
        className={`novel-book-page ${isLeft ? 'page-left' : 'page-right'} ${className}`}
        style={{
          paddingTop: `${pagePaddingY}px`,
          paddingBottom: `${pagePaddingY}px`,
          paddingLeft: `${pagePaddingX}px`,
          paddingRight: `${pagePaddingX}px`,
        }}
      >
        {/* Book Running Header */}
        <div className="novel-book-header" style={{ color: currentTheme.muted }}>
          <span className="truncate">
            {isLeft ? bookTitle : displayChapterName}
          </span>
        </div>

        {/* Text Content */}
        <div className="novel-book-content">
          {isValid ? (
            <article className="novel-book-text" style={pageTextStyle}>
              {content}
            </article>
          ) : (
            <div className="novel-book-empty">
              <BookOpen className="h-8 w-8 opacity-20" />
            </div>
          )}
        </div>

        {/* Book Running Footer (Symmetrical page numbering like printed books) */}
        <div
          className={`novel-book-footer ${isLeft ? 'justify-start' : 'justify-end'}`}
          style={{ color: currentTheme.muted }}
        >
          {isValid && <span className="tabular-nums font-mono text-xs">{pageNum}</span>}
        </div>
      </div>
    )
  }

  // Underlay pages for smooth 3D turning
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
    <div
      className="novel-book-viewport relative w-full select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Book Container */}
      <div
        ref={frameRef}
        className={[
          'novel-book-stage',
          isDoublePage ? 'is-double-page' : 'is-single-page',
          `theme-${theme}`,
          flipDirection ? `is-turning-${flipDirection}` : '',
        ].filter(Boolean).join(' ')}
        style={{
          backgroundColor: currentTheme.bgStage,
          color: currentTheme.ink,
        }}
        role="region"
        aria-label="Khung sách tiểu thuyết 3D"
      >
        {/* Click zones for intuitive left/right page flipping */}
        <div
          className="novel-click-zone left-zone"
          onClick={() => turnPage('backward')}
          title="Lật trang trước (←)"
        />
        <div
          className="novel-click-zone right-zone"
          onClick={() => turnPage('forward')}
          title="Lật trang sau (→)"
        />

        {/* Underlay Spread (Visible beneath flipping sheet) */}
        <div className="novel-book-underlay" aria-hidden="true">
          {isDoublePage && renderPage(underlayLeft, underlayStart, true, 'underlay-left')}
          {renderPage(
            isDoublePage ? underlayRight : underlayLeft,
            isDoublePage ? underlayStart + 1 : underlayStart,
            false,
            'underlay-right',
          )}
        </div>

        {/* Static Spread (Current visible pages) */}
        <div className="novel-book-spread">
          {isDoublePage && renderPage(pages[spreadStart], spreadStart, true, 'spread-left')}
          {renderPage(
            isDoublePage ? pages[spreadStart + 1] : pages[spreadStart],
            isDoublePage ? spreadStart + 1 : spreadStart,
            false,
            'spread-right',
          )}
        </div>

        {/* Dynamic 3D Flipping Sheet (BooksJS transform-origin + preserve-3d) */}
        <div
          className={`novel-book-sheet${flipDirection ? ` is-turning-${flipDirection}` : ''}`}
          onTransitionEnd={onFlipEnd}
          aria-hidden="true"
        >
          {/* Front Face */}
          <div className="novel-sheet-face novel-sheet-front">
            {renderPage(
              sheetPage,
              (flipDirection === 'forward' ? spreadStart + pageStep - 1 : spreadStart),
              !isDoublePage || flipDirection === 'backward',
              'sheet-front-page',
            )}
          </div>
          {/* Back Face (Rotated 180deg) */}
          <div className="novel-sheet-face novel-sheet-back">
            {renderPage(
              sheetBackPage,
              (flipDirection === 'forward' ? spreadStart + pageStep : spreadStart - 1),
              isDoublePage && flipDirection === 'forward',
              'sheet-back-page',
            )}
          </div>
        </div>

        {/* Spine 3D Crease & Shadow Overlay (BooksJS center crease emulation) */}
        {isDoublePage && (
          <div
            className="novel-book-spine"
            style={{ background: currentTheme.spineShadow }}
            aria-hidden="true"
          />
        )}
      </div>

      <NovelPageNavigation
        currentPage={boundedPageIndex + 1}
        totalPages={pages.length}
        isAtFirstSpread={spreadStart === 0}
        isAtLastPage={visibleLastPage === pages.length - 1}
        canPreviousChapter={canPreviousChapter}
        canNextChapter={canNextChapter}
        onPreviousPage={() => turnPage('backward')}
        onNextPage={() => turnPage('forward')}
        onPageChange={(page) => {
            pendingPageRef.current = null
            setFlipDirection(null)
            setPageIndex(page - 1)
          }}
      />
    </div>
  )
}
