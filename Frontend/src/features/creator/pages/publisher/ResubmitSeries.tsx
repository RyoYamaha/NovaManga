import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { publisherService } from '@/features/creator/api/publisher.service'
import { Button } from '@/components/ui/button'
import { RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react'

export function ResubmitSeries() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => publisherService.resubmitContent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publisher-contents'] })
      navigate('/publisher/catalog')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nộp lại phê duyệt.')
    },
  })

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/publisher/catalog')}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
          </Button>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
          <RotateCcw className="w-6 h-6 text-primary" /> Kháng nghị & Nộp lại phê duyệt
        </h1>
        <p className="text-xs text-muted-foreground">
          Sử dụng chức năng này để yêu cầu ban quản trị xem xét lại tác phẩm đã bị từ chối sau khi bạn đã chỉnh sửa hoàn tất.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            Vui lòng chắc chắn rằng bạn đã cập nhật và khắc phục toàn bộ các vi phạm hoặc thiếu sót dẫn đến việc bị từ chối trước đó. Ban quản trị sẽ thẩm định lại toàn bộ nội dung và hồ sơ bản quyền.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="outline" onClick={() => navigate('/publisher/catalog')}>
            Hủy bỏ
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2 px-6 font-bold"
          >
            <RotateCcw className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
            {mutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu xét duyệt'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ResubmitSeries

