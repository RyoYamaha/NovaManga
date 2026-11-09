import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageJumpInput } from '@/components/common/PageJumpInput'

interface NovelPageNavigationProps {
  currentPage: number
  totalPages: number
  isAtFirstSpread: boolean
  isAtLastPage: boolean
  canPreviousChapter: boolean
  canNextChapter: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onPageChange: (page: number) => void
}

export function NovelPageNavigation({
  currentPage,
  totalPages,
  isAtFirstSpread,
  isAtLastPage,
  canPreviousChapter,
  canNextChapter,
  onPreviousPage,
  onNextPage,
  onPageChange,
}: NovelPageNavigationProps) {
  return (
    <div className="mt-3 flex items-center justify-between px-2 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={onPreviousPage}
        disabled={totalPages === 0 || (isAtFirstSpread && !canPreviousChapter)}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/60 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Trang trước</span>
      </button>

      <PageJumpInput
        compact
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <button
        type="button"
        onClick={onNextPage}
        disabled={totalPages === 0 || (isAtLastPage && !canNextChapter)}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/60 disabled:opacity-30"
      >
        <span className="hidden sm:inline">Trang sau</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
