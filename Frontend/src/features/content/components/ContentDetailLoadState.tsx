import { Link } from 'react-router'
import { isAxiosError } from 'axios'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContentDetailLoadStateProps {
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
}

export function ContentDetailLoadState({
  isLoading,
  isError,
  error,
  onRetry,
}: ContentDetailLoadStateProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20" />
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent shadow-lg shadow-primary/20" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">Đang tải thông tin tác phẩm...</p>
          <p className="text-xs text-muted-foreground">Vui lòng đợi giây lát</p>
        </div>
      </div>
    )
  }

  if (!isError) return null

  const notFound = isAxiosError(error) && error.response?.status === 404
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-2xl backdrop-blur-xl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {notFound ? 'Không tìm thấy tác phẩm' : 'Không thể tải thông tin tác phẩm'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {notFound
          ? 'Tác phẩm bạn yêu cầu không tồn tại, đã bị gỡ bỏ hoặc quyền truy cập đã thay đổi.'
          : 'Đã xảy ra lỗi kết nối với máy chủ. Vui lòng kiểm tra đường truyền và thử lại.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">Về trang chủ</Link>
        </Button>
        {!notFound && (
          <Button
            onClick={onRetry}
            className="rounded-xl bg-primary font-semibold text-primary-foreground"
          >
            Thử lại ngay
          </Button>
        )}
      </div>
    </div>
  )
}
