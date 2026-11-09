import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PageJumpInputProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  compact?: boolean
}

export function PageJumpInput({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  compact = false,
}: PageJumpInputProps) {
  const [value, setValue] = useState(String(currentPage))

  useEffect(() => {
    setValue(String(currentPage))
  }, [currentPage])

  const jumpToPage = () => {
    const requestedPage = Number(value)
    if (!Number.isSafeInteger(requestedPage) || value.trim() === '') {
      setValue(String(currentPage))
      return
    }

    const nextPage = Math.min(totalPages, Math.max(1, requestedPage))
    setValue(String(nextPage))
    if (nextPage !== currentPage) onPageChange(nextPage)
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {!compact && <span className="text-xs text-muted-foreground">Trang</span>}
      <Input
        type="number"
        min={1}
        max={Math.max(1, totalPages)}
        step={1}
        inputMode="numeric"
        aria-label="Số trang muốn đến"
        disabled={totalPages === 0}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            jumpToPage()
          }
        }}
        className={`rounded-lg border-white/10 bg-[#0b0f17] text-center text-xs tabular-nums ${
          compact ? 'h-7 w-12 px-1' : 'h-8 w-[4.25rem] px-2'
        }`}
      />
      <span className="text-xs text-muted-foreground">/ {totalPages}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={jumpToPage}
        disabled={totalPages === 0}
        className={`rounded-lg border-white/10 px-2 text-xs ${compact ? 'h-7' : 'h-8'}`}
        aria-label="Đi đến trang đã nhập"
      >
        Đi
      </Button>
    </div>
  )
}
