import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { adminService } from '@/features/admin/api/admin.service'
import { useAppDialog } from '@/components/common/AppDialogProvider'

export function ChapterReview() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [error, setError] = useState<string | null>(null)
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  const chapter = useQuery({
    queryKey: ['admin-chapter-detail', id],
    queryFn: () => adminService.getChapterDetail(id!),
    enabled: !!id,
  })

  const review = useMutation({
    mutationFn: (action: 'approve' | 'reject') => {
      if (!id) throw new Error('Thiếu chapter ID')
      if (action === 'approve') return adminService.approveChapter(id)
      return adminService.rejectChapter(id)
    },
    onSuccess: async () => {
      const contentId = chapter.data?.contentId
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-pending-chapters'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-content-detail', contentId] }),
      ])
      navigate(returnTo ?? `/admin/content/${contentId}`)
    },
    onError: () =>
      setError('Không thể cập nhật chapter. Có thể chapter đã được xử lý, hãy tải lại.'),
  })

  if (chapter.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Clock className="h-4 w-4 animate-spin text-primary" />
        Đang tải nội dung chapter...
      </div>
    )
  }

  if (chapter.isError || !chapter.data) {
    return <p className="p-6 text-sm text-destructive">Không tải được thông tin chapter.</p>
  }

  const data = chapter.data
  const textBody = data.chapterContent?.textBody ?? ''
  const canModerate = data.moderationStatus === 'PendingReview'

  const confirmReview = async (action: 'approve' | 'reject') => {
    const approved = action === 'approve'
    const confirmed = await confirm({
      title: approved ? 'Xác nhận duyệt chapter' : 'Xác nhận từ chối chapter',
      description: `${approved ? 'Duyệt và xuất bản' : 'Từ chối'} chapter ${data.number}${
        data.title ? `: ${data.title}` : ''
      }?`,
      confirmLabel: approved ? 'Duyệt chapter' : 'Từ chối chapter',
      tone: approved ? 'default' : 'destructive',
    })
    if (confirmed) {
      setError(null)
      review.mutate(action)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* 1. TOP NAV & BREADCRUMB */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-white">
          <Link to={returnTo ?? `/admin/content/${data.contentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại tác phẩm
          </Link>
        </Button>
      </div>

      {/* 2. CHAPTER HEADER CARD */}
      <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-300">
                {data.content.type}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <Link
                to={`/admin/content/${data.contentId}`}
                className="text-xs font-semibold text-primary hover:underline line-clamp-1"
              >
                {data.content.title}
              </Link>
            </div>

            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Chương {data.number} {data.title && `: ${data.title}`}
            </h1>

            <p className="mt-1 text-xs text-muted-foreground">
              Mã ID: {data.id} · Xuất bản: {data.content.publicationStatus}
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                data.moderationStatus === 'Published'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  data.moderationStatus === 'Published'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              {data.moderationStatus === 'Published'
                ? 'Đã duyệt'
                : data.moderationStatus === 'PendingReview'
                  ? 'Chờ duyệt'
                  : 'Đã từ chối'}
            </span>
          </div>
        </div>
      </div>

      {data.content.type === 'Novel' && (
        <section className="rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <h2 className="text-sm font-bold text-white">Kết quả AI hỗ trợ kiểm duyệt</h2>
          <p className="mt-1 text-sm text-slate-300">
            {data.aiModerationStatus === 'Flagged'
              ? 'AI gắn cờ nội dung này để Admin xem xét.'
              : data.aiModerationStatus === 'Clear'
                ? 'AI không gắn cờ nội dung này.'
                : data.aiModerationStatus === 'Unavailable'
                  ? 'AI chưa thể kiểm tra nội dung. Cần duyệt thủ công.'
                  : 'Chưa có kết quả kiểm duyệt AI.'}
          </p>
          {data.aiModerationReason && (
            <p className="mt-2 text-sm text-amber-300">{data.aiModerationReason}</p>
          )}
        </section>
      )}

      {/* 3. CONTENT PREVIEW */}
      {textBody ? (
        <article className="max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#131b26] p-6 text-sm leading-8 whitespace-pre-wrap text-slate-200 shadow-sm font-sans">
          {textBody}
        </article>
      ) : data.pages.length > 0 ? (
        <div className="max-h-[75vh] space-y-6 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0f17] p-6 shadow-sm">
          {data.pages.map((page) => (
            <figure key={page.id} className="space-y-2 text-center">
              <figcaption className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Trang {page.pageNumber}
              </figcaption>
              <a href={page.imageUrl} target="_blank" rel="noreferrer" className="inline-block">
                <img
                  src={page.imageUrl}
                  alt={`Trang ${page.pageNumber}`}
                  loading="lazy"
                  className="mx-auto h-auto max-w-full rounded-xl border border-white/10 object-contain shadow-md"
                />
              </a>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 p-12 text-center text-sm text-muted-foreground">
          Chương này chưa có dữ liệu trang ảnh hoặc nội dung văn bản.
        </div>
      )}

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      {/* 4. MODERATION ACTION BAR */}
      {canModerate && (
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-4 shadow-xl">
          <Button
            variant="outline"
            disabled={review.isPending}
            onClick={() => void confirmReview('reject')}
            className="rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white font-semibold"
          >
            <XCircle className="mr-1.5 h-4 w-4" /> Từ chối chương
          </Button>
          <Button
            disabled={review.isPending || (!textBody.trim() && data.pages.length === 0)}
            onClick={() => void confirmReview('approve')}
            className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Duyệt và xuất bản chương
          </Button>
        </div>
      )}
    </div>
  )
}

export default ChapterReview