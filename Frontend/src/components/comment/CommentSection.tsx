import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Flag, Loader2, MessageSquare, Reply, Send } from 'lucide-react'
import { commentService, type CommentData } from '@/services/comment.service'
import { useAuthStore } from '@/stores/auth-store'
import { ReportModal } from '@/components/shared/ReportModal'
import { Button } from '@/components/ui/button'

interface CommentSectionProps {
  contentId: string
  variant?: 'embedded' | 'sidebar'
  className?: string
}

interface CreateCommentVariables {
  body: string
  parentCommentId?: string
}

export function CommentSection({
  contentId,
  variant = 'embedded',
  className = '',
}: CommentSectionProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [commentText, setCommentText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [commentToReport, setCommentToReport] = useState<string | null>(null)
  const [userToReport, setUserToReport] = useState<string | null>(null)

  const comments = useQuery({
    queryKey: ['comments', contentId],
    queryFn: () => commentService.getComments(contentId),
  })

  const createComment = useMutation({
    mutationFn: ({ body, parentCommentId }: CreateCommentVariables) =>
      commentService.createComment(contentId, body, parentCommentId),
    onSuccess: async (_comment, variables) => {
      if (variables.parentCommentId) {
        setReplyText('')
        setReplyingTo(null)
      } else {
        setCommentText('')
      }
      await queryClient.invalidateQueries({ queryKey: ['comments', contentId] })
    },
  })

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = commentText.trim()
    if (!body || createComment.isPending) return
    createComment.mutate({ body })
  }

  const submitReply = (event: FormEvent<HTMLFormElement>, parentCommentId: string) => {
    event.preventDefault()
    const body = replyText.trim()
    if (!body || createComment.isPending) return
    createComment.mutate({ body, parentCommentId })
  }

  const renderComment = (comment: CommentData, isReply = false) => (
    <article
      key={comment.id}
      className={`group/comment flex gap-3 transition-colors ${isReply ? 'mt-3.5' : 'pt-2'}`}
    >
      {/* Avatar */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold shadow-inner ${
          isReply
            ? 'h-7 w-7 bg-primary/15 text-[11px] text-primary'
            : 'h-9 w-9 bg-gradient-to-tr from-amber-500/20 to-primary/20 text-xs text-primary border border-primary/20'
        }`}
      >
        {comment.user.username.slice(0, 2).toUpperCase() || 'U'}
      </div>

      <div className="min-w-0 flex-1">
        {/* Comment Bubble */}
        <div className="rounded-2xl border border-white/10 bg-[#151d27] p-3.5 text-sm shadow-sm transition-all hover:border-white/20">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">
                {comment.user.username}
              </span>
              <time className="text-[11px] text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>

            {/* Quick Actions (Report) */}
            <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover/comment:opacity-100">
              <button
                type="button"
                onClick={() => setCommentToReport(comment.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-destructive/15 hover:text-destructive transition-colors"
                title="Báo cáo bình luận này"
                aria-label="Báo cáo bình luận"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setUserToReport(comment.user.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-destructive/15 hover:text-destructive transition-colors"
                title="Báo cáo tài khoản này"
                aria-label="Báo cáo người dùng"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="whitespace-pre-wrap break-words text-slate-200 text-xs sm:text-sm leading-relaxed">
            {comment.body}
          </p>
        </div>

        {/* Reply Action Trigger */}
        {!isReply && user && (
          <div className="mt-1.5 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                setReplyingTo((current) => (current === comment.id ? null : comment.id))
                setReplyText('')
                createComment.reset()
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              <span>{replyingTo === comment.id ? 'Đóng phản hồi' : 'Trả lời'}</span>
            </button>
          </div>
        )}

        {/* Reply Form */}
        {!isReply && replyingTo === comment.id && (
          <form
            onSubmit={(event) => submitReply(event, comment.id)}
            className="mt-3 space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.03] p-3 backdrop-blur-sm"
          >
            <textarea
              aria-label={`Trả lời ${comment.user.username}`}
              autoFocus
              maxLength={1000}
              rows={2}
              value={replyText}
              onChange={(event) => {
                setReplyText(event.target.value)
                createComment.reset()
              }}
              placeholder={`Viết phản hồi cho ${comment.user.username}...`}
              disabled={createComment.isPending}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#121820] p-3 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
            {createComment.isError && createComment.variables?.parentCommentId === comment.id && (
              <p role="alert" className="text-xs text-destructive">
                Không gửi được phản hồi. Vui lòng thử lại.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyText('')
                  createComment.reset()
                }}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <Button
                type="submit"
                size="sm"
                disabled={!replyText.trim() || createComment.isPending}
                className="rounded-xl bg-primary text-slate-950 font-bold hover:brightness-110"
              >
                {createComment.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3.5 w-3.5" />
                )}
                Gửi phản hồi
              </Button>
            </div>
          </form>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="relative mt-2 space-y-2 border-l-2 border-white/10 pl-3.5 sm:pl-5">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </article>
  )

  // ==========================================
  // CHẾ ĐỘ 1: SIDEBAR (Dùng trong ReadManga & ReadNovel)
  // ==========================================
  if (variant === 'sidebar') {
    return (
      <section
        className={`sticky top-24 flex h-[calc(100vh-8rem)] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161e29]/95 backdrop-blur-xl lg:w-[350px] ${className}`}
        aria-label="Bình luận tác phẩm"
      >
        <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-4 font-bold">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Bình luận</span>
          </div>
          {comments.data && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {comments.data.length}
            </span>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {comments.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.isError ? (
            <p role="alert" className="text-center text-xs text-destructive">
              Không tải được bình luận. Vui lòng thử lại.
            </p>
          ) : comments.data && comments.data.length > 0 ? (
            comments.data.map((comment) => renderComment(comment))
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400 p-4">
              <MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </div>
          )}
        </div>

        <ReportModal
          isOpen={!!commentToReport}
          onClose={() => setCommentToReport(null)}
          targetType="Comment"
          targetId={commentToReport ?? ''}
        />
        <ReportModal
          isOpen={!!userToReport}
          onClose={() => setUserToReport(null)}
          targetType="User"
          targetId={userToReport ?? ''}
        />

        {user ? (
          <form
            onSubmit={submitComment}
            className="relative flex items-end gap-2 border-t border-white/10 bg-[#131922] p-3"
          >
            <textarea
              aria-label="Viết bình luận"
              maxLength={1000}
              rows={1}
              value={commentText}
              onChange={(event) => {
                setCommentText(event.target.value)
                createComment.reset()
              }}
              placeholder="Viết bình luận..."
              disabled={createComment.isPending}
              className="max-h-24 min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-[#1a2330] px-3 py-2 text-xs text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Gửi bình luận"
              disabled={!commentText.trim() || createComment.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-slate-950 font-bold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
            {createComment.isError && !createComment.variables?.parentCommentId && (
              <p
                role="alert"
                className="absolute bottom-14 left-3 right-3 rounded-lg bg-destructive/15 p-1.5 text-xs text-destructive text-center"
              >
                Không gửi được bình luận. Vui lòng thử lại.
              </p>
            )}
          </form>
        ) : (
          <div className="border-t border-white/10 bg-[#131922] p-3 text-center text-xs text-slate-400">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>{' '}
            để bình luận.
          </div>
        )}
      </section>
    )
  }

  // ==========================================
  // CHẾ ĐỘ 2: EMBEDDED TOÀN MÀN HÌNH (Dùng trong ContentDetail)
  // ==========================================
  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. KHUNG SOẠN THẢO BÌNH LUẬN (INPUT BOX TRÊN CÙNG) */}
      {user ? (
        <form
          onSubmit={submitComment}
          className="relative rounded-2xl border border-white/10 bg-[#151d27] p-4 shadow-md transition-all focus-within:border-primary/50"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {(user.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <span>
                Bình luận với tư cách <strong className="text-white">{user.username}</strong>
              </span>
            </div>
            <span>{commentText.length}/1000 ký tự</span>
          </div>

          <textarea
            aria-label="Viết bình luận"
            maxLength={1000}
            rows={3}
            value={commentText}
            onChange={(event) => {
              setCommentText(event.target.value)
              createComment.reset()
            }}
            placeholder="Chia sẻ cảm nghĩ, dự đoán cốt truyện hoặc trao đổi cùng cộng đồng..."
            disabled={createComment.isPending}
            className="w-full resize-y rounded-xl border border-transparent bg-transparent p-1 text-sm text-foreground placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
          />

          {createComment.isError && !createComment.variables?.parentCommentId && (
            <p role="alert" className="mt-2 rounded-lg bg-destructive/15 p-2 text-xs text-destructive">
              Không gửi được bình luận. Vui lòng kiểm tra lại kết nối và thử lại.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-[11px] text-slate-500">
              Hãy giữ bình luận văn minh và tôn trọng độc giả khác.
            </span>
            <Button
              type="submit"
              disabled={!commentText.trim() || createComment.isPending}
              className="rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 px-5 font-bold text-slate-950 shadow-md shadow-sky-500/25 hover:brightness-110 active:scale-95"
            >
              {createComment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Gửi bình luận
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#151d27]/70 p-5 text-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 text-slate-300">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Tham gia cộng đồng thảo luận</p>
              <p className="text-xs text-slate-400">
                Đăng nhập để chia sẻ cảm nghĩ, đánh giá và giao lưu cùng độc giả khác.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-xl bg-primary text-slate-950 font-bold hover:brightness-110 shrink-0">
            <Link to="/login">Đăng nhập ngay</Link>
          </Button>
        </div>
      )}

      {/* 2. DANH SÁCH BÌNH LUẬN */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-sm font-bold text-slate-200">
            Tất cả bình luận ({comments.data?.length ?? 0})
          </h3>
        </div>

        {comments.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs">Đang tải bình luận...</span>
          </div>
        ) : comments.isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p role="alert" className="text-sm text-destructive font-medium">
              Không thể tải danh sách bình luận. Vui lòng thử lại sau.
            </p>
          </div>
        ) : comments.data && comments.data.length > 0 ? (
          <div className="space-y-4">
            {comments.data.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">Chưa có bình luận nào</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Hãy là người đầu tiên chia sẻ suy nghĩ và cảm nhận về tác phẩm này!
            </p>
          </div>
        )}
      </div>

      {/* Modals báo cáo */}
      <ReportModal
        isOpen={!!commentToReport}
        onClose={() => setCommentToReport(null)}
        targetType="Comment"
        targetId={commentToReport ?? ''}
      />
      <ReportModal
        isOpen={!!userToReport}
        onClose={() => setUserToReport(null)}
        targetType="User"
        targetId={userToReport ?? ''}
      />
    </div>
  )
}

export default CommentSection
