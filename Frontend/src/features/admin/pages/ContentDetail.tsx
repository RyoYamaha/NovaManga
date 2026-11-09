import { useLocation, useNavigate, useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import { adminService } from '@/features/admin/api/admin.service'
import { ArrowLeft, CheckCircle2, Clock, ImageOff, ShieldCheck, ShieldAlert, FileText, ChevronRight, XCircle, AlertCircle, Layers } from 'lucide-react'
import { useState } from 'react'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import { Button } from '@/components/ui/button'

export function ContentDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/admin/content/unpublished'
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [rejectReason, setRejectReason] = useState('')

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content-detail', id],
    queryFn: () => contentService.getDetail(id!).then(res => res.data),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: () => adminService.approveContent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: () => adminService.rejectContent(id!, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] })
      navigate(returnTo)
    }
  })

  if (isLoading) return (
    <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Clock className="w-8 h-8 animate-spin text-primary" />
      <span className="font-semibold text-sm">Đang tải thông tin chi tiết tác phẩm...</span>
    </div>
  )
  if (!content) return (
    <div className="p-12 text-center text-destructive flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <AlertCircle className="w-10 h-10 text-rose-500" />
      <span className="font-bold text-lg">Không tìm thấy tác phẩm yêu cầu</span>
      <Link to={returnTo}>
        <Button variant="outline" className="mt-2">Quay lại danh sách</Button>
      </Link>
    </div>
  )

  const confirmContentAction = async (action: 'approve' | 'reject') => {
    const approved = action === 'approve'
    const confirmed = await confirm({
      title: approved ? 'Xác nhận duyệt và xuất bản truyện' : 'Xác nhận từ chối truyện',
      description: approved
        ? `Bạn có chắc chắn muốn duyệt và công khai phát hành tác phẩm "${content.title}" lên hệ thống không?`
        : `Từ chối duyệt "${content.title}" và gửi kèm lý do cho tác giả/nhà xuất bản?`,
      confirmLabel: approved ? 'Duyệt xuất bản' : 'Từ chối duyệt',
      tone: approved ? 'default' : 'destructive',
    })
    if (!confirmed) return
    if (approved) approveMutation.mutate()
    else rejectMutation.mutate()
  }

  const isPending = content.publicationStatus === 'PendingApproval'

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link to={returnTo}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách quản lý
          </Button>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative h-48 w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17] shadow-md">
            {content.coverImageUrl ? (
              <img src={content.coverImageUrl} alt={content.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 font-bold text-xs tracking-widest text-muted-foreground/40">
                <ImageOff className="h-8 w-8" />
                <span>CHƯA CÓ BÌA</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isPending
                  ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : content.publicationStatus === 'Published'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}>
                {isPending && <Clock className="h-3.5 w-3.5 animate-pulse" />}
                {content.publicationStatus === 'Published' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isPending ? 'Chờ kiểm duyệt' : content.publicationStatus === 'Published' ? 'Đã xuất bản' : content.publicationStatus}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {content.type === 'Manga' ? 'Manga / Truyện tranh' : 'Novel / Tiểu thuyết'}
              </span>

              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {content.ownershipTier === 'Licensed' ? 'Bản dịch có bản quyền' : content.ownershipTier === 'FanTranslation' ? 'Bản dịch cộng đồng' : 'Tác phẩm gốc'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{content.title}</h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-1">
              <div>Người đăng: <span className="font-bold text-foreground">{content.uploader?.username || 'Chưa rõ'}</span></div>
              <div className="hidden sm:inline">•</div>
              <div>Ngày nộp: <span className="font-bold text-foreground">{new Date(content.createdAt).toLocaleDateString('vi-VN')}</span></div>
              <div className="hidden sm:inline">•</div>
              <div>Số chương: <span className="font-bold text-foreground">{content.chapters?.length || 0} chương</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (Details + Moderation Decision) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Moderation Actions Box (If Pending) */}
          {isPending && (
            <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#182332] to-[#131b26] p-6 shadow-md md:p-7">
              <div className="flex items-center gap-2.5 text-amber-400 mb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h2 className="text-sm font-black uppercase tracking-wider">Khu vực phê duyệt của Quản trị viên</h2>
              </div>
              <div className="mb-5 rounded-xl border border-white/10 bg-[#0b0f17]/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Kết quả AI hỗ trợ kiểm duyệt
                </div>
                <p className="mt-2 text-sm text-slate-200">
                  {content.aiModerationStatus === 'Flagged'
                    ? 'AI gắn cờ nội dung này để Admin xem xét.'
                    : content.aiModerationStatus === 'Clear'
                      ? 'AI không gắn cờ nội dung này.'
                      : content.aiModerationStatus === 'Unavailable'
                        ? 'AI chưa thể kiểm tra nội dung. Cần duyệt thủ công.'
                        : 'Chưa có kết quả kiểm duyệt AI.'}
                </p>
                {content.aiModerationReason && (
                  <p className="mt-2 text-sm text-amber-300">{content.aiModerationReason}</p>
                )}
                {content.aiModeratedAt && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Kiểm tra lúc {new Date(content.aiModeratedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra nội dung, tính hợp lệ bản quyền và chất lượng các chương trước khi quyết định xuất bản.
              </p>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Lý do từ chối (bắt buộc nếu từ chối duyệt)
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                  placeholder="Nhập cụ thể nguyên nhân từ chối để người đăng nắm rõ và tiến hành chỉnh sửa lại..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="destructive"
                  onClick={() => void confirmContentAction('reject')}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="gap-2 px-6"
                >
                  <XCircle className="w-4 h-4" /> Từ chối và gửi phản hồi
                </Button>

                <Button
                  onClick={() => void confirmContentAction('approve')}
                  disabled={approveMutation.isPending}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4" /> Phê duyệt & Xuất bản ngay
                </Button>
              </div>
            </div>
          )}

          {/* Basic Story Information */}
          <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 md:p-7 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Thông tin cơ bản
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Tên tác phẩm</p>
                <p className="font-bold text-foreground text-sm">{content.title}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Định dạng</p>
                <p className="font-bold text-foreground text-sm">{content.type}</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-muted-foreground uppercase text-[11px] mb-2">Tóm tắt nội dung</p>
              <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                {content.synopsis || <span className="italic text-muted-foreground/60">Chưa có phần tóm tắt nội dung.</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-2">Thể loại (Genres)</p>
                <div className="flex flex-wrap gap-1.5">
                  {content.genres && content.genres.length > 0 ? (
                    content.genres.map(g => (
                      <span key={g.genre.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {g.genre.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Chưa chọn thể loại</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-2">Thẻ nhãn (Tags)</p>
                <div className="flex flex-wrap gap-1.5">
                  {content.tags && content.tags.length > 0 ? (
                    content.tags.map(t => (
                      <span key={t.tag.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        #{t.tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Không có thẻ</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legal / Copyright Information */}
          <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 md:p-7 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Bản quyền & Quyền phát hành
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Cấp độ bản quyền</p>
                <p className="font-bold text-foreground text-sm">
                  {content.ownershipTier === 'Licensed' ? 'Bản quyền chính thức (Licensed)' : content.ownershipTier === 'FanTranslation' ? 'Bản dịch phi thương mại (FanTranslation)' : 'Nguyên tác độc quyền (Original)'}
                </p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Tác phẩm gốc liên kết</p>
                <p className="font-bold text-foreground text-sm">{content.parentContent?.title || content.title}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Nhà xuất bản / Tổ chức</p>
                <p className="font-bold text-foreground text-sm">{content.publisher?.organizationName || 'Cá nhân / Độc lập'}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[11px] mb-1">Trạng thái xác thực đối tác</p>
                {content.publisher ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Đã xác thực pháp nhân
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Không áp dụng</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Chapters list) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Danh sách chương ({content.chapters?.length || 0})
              </h2>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {content.chapters?.map((chapter) => (
                <Link
                  key={chapter.id}
                  to={`/admin/chapters/${chapter.id}`}
                  state={{ returnTo: `/admin/content/${content.id}` }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0b0f17] p-3 text-xs transition-all hover:border-primary/40 hover:bg-white/[0.04] group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {chapter.title || `Chương ${chapter.number}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Số thứ tự: #{chapter.number}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      chapter.moderationStatus === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {chapter.moderationStatus === 'Published' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}

              {(!content.chapters || content.chapters.length === 0) && (
                <div className="text-center py-8 text-xs text-muted-foreground/60 italic border border-dashed border-white/10 rounded-xl">
                  Chưa có chương nào được tải lên cho truyện này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentDetail
