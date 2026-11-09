import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent, TransitionEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import '../styles/NovelFlipBook.css'

interface MangaPage {
  id: string
  imageUrl: string
  pageNumber: number
}

interface MangaPageFlipProps {
  pages: MangaPage[]
  initialPage?: number
  canPreviousChapter: boolean
  canNextChapter: boolean
  onPageChange: (pageIndex: number, pageCount: number) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
}

type FlipDirection = 'forward' | 'backward'

export function MangaPageFlip({
  pages,
  initialPage = 1,
  canPreviousChapter,
  canNextChapter,
  onPageChange,
  onPreviousChapter,
  onNextChapter,
}: MangaPageFlipProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pendingPageRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0 })
  const [pageIndex, setPageIndex] = useState(
    Math.max(0, Math.min(initialPage - 1, pages.length - 1)),
  )
  const [flipDirection, setFlipDirection] = useState<FlipDirection | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setDimensions({ width: Math.floor(entry.contentRect.width) })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const isDoublePage = dimensions.width >= 840
  const pageStep = isDoublePage ? 2 : 1
  const spreadStart = Math.min(
    Math.floor(pageIndex / pageStep) * pageStep,
    Math.max(0, Math.ceil(pages.length / pageStep) * pageStep - pageStep),
  )
  const visibleLastPage = Math.min(spreadStart + pageStep - 1, pages.length - 1)

  useEffect(() => {
    onPageChange(visibleLastPage, pages.length)
  }, [onPageChange, pages.length, visibleLastPage])

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
  }, [
    canNextChapter,
    canPreviousChapter,
    flipDirection,
    onNextChapter,
    onPreviousChapter,
    pageStep,
    pages.length,
    spreadStart,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable) ||
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

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current
    const endX = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (startX === null || endX === undefined) return
    if (startX - endX > 50) turnPage('forward')
    else if (startX - endX < -50) turnPage('backward')
  }

  const finishFlip = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !flipDirection) return
    if (pendingPageRef.current !== null) setPageIndex(pendingPageRef.current)
    pendingPageRef.current = null
    setFlipDirection(null)
  }

  const renderPage = (page: MangaPage | undefined, pageNumber: number, isLeft: boolean, className = '') => (
    <div
      key={`${className}-${page?.id ?? pageNumber}`}
      className={`novel-book-page manga-book-page ${isLeft ? 'page-left' : 'page-right'} ${className}`}
    >
      {page && (
        <img
          src={page.imageUrl}
          alt={`Trang ${page.pageNumber}`}
          className="manga-book-image"
          draggable={false}
        />
      )}
    </div>
  )

  const underlayStart = spreadStart + (flipDirection === 'forward' ? pageStep : -pageStep)
  const sheetPage = flipDirection === 'forward'
    ? pages[spreadStart + pageStep - 1]
    : pages[spreadStart]
  const sheetBackPage = flipDirection === 'forward'
    ? pages[spreadStart + pageStep]
    : pages[spreadStart - 1]

  return (
    <div className="manga-book-viewport">
      <div
        ref={frameRef}
        className={[
          'novel-book-stage',
          isDoublePage ? 'is-double-page' : 'is-single-page',
          'theme-dark',
          'manga-book-stage',
          flipDirection ? `is-turning-${flipDirection}` : '',
        ].filter(Boolean).join(' ')}
        role="region"
        aria-label="Khung sách truyện tranh"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="novel-click-zone left-zone" onClick={() => turnPage('backward')} aria-hidden="true" />
        <div className="novel-click-zone right-zone" onClick={() => turnPage('forward')} aria-hidden="true" />

        <div className="novel-book-underlay" aria-hidden="true">
          {isDoublePage && renderPage(pages[underlayStart], underlayStart, true, 'underlay-left')}
          {renderPage(
            isDoublePage ? pages[underlayStart + 1] : pages[underlayStart],
            isDoublePage ? underlayStart + 1 : underlayStart,
            false,
            'underlay-right',
          )}
        </div>

        <div className="novel-book-spread">
          {isDoublePage && renderPage(pages[spreadStart], spreadStart, true, 'spread-left')}
          {renderPage(
            isDoublePage ? pages[spreadStart + 1] : pages[spreadStart],
            isDoublePage ? spreadStart + 1 : spreadStart,
            false,
            'spread-right',
          )}
        </div>

        <div
          className={`novel-book-sheet${flipDirection ? ` is-turning-${flipDirection}` : ''}`}
          onTransitionEnd={finishFlip}
          aria-hidden="true"
        >
          <div className="novel-sheet-face novel-sheet-front">
            {renderPage(
              sheetPage,
              flipDirection === 'forward' ? spreadStart + pageStep - 1 : spreadStart,
              !isDoublePage || flipDirection === 'backward',
              'sheet-front-page',
            )}
          </div>
          <div className="novel-sheet-face novel-sheet-back">
            {renderPage(
              sheetBackPage,
              flipDirection === 'forward' ? spreadStart + pageStep : spreadStart - 1,
              isDoublePage && flipDirection === 'forward',
              'sheet-back-page',
            )}
          </div>
        </div>

        {isDoublePage && (
          <div
            className="novel-book-spine"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.2) 46%, rgba(255,255,255,0.55) 52%, rgba(0,0,0,0.04))',
            }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="manga-book-controls">
        <button
          type="button"
          onClick={() => turnPage('backward')}
          disabled={pages.length === 0 || (spreadStart === 0 && !canPreviousChapter)}
          aria-label="Lật trang trước"
          className="manga-book-button"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Trang trước</span>
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
          aria-label="Lật trang sau"
          className="manga-book-button"
        >
          <span>Trang sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
