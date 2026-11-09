import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/ticket.service'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, ShieldCheck, User } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export function SupportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [reply, setReply] = useState('')

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => (await ticketService.getTicketDetails(id!)).data,
    enabled: !!id,
    refetchInterval: 5_000,
  })

  const replyMutation = useMutation({
    mutationFn: () => ticketService.replyTicket(id!, { body: reply }),
    onSuccess: () => {
      setReply('')
      qc.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (reply.trim().length >= 2) {
      replyMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground animate-pulse">
        Đang tải nội dung hội thoại...
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">Không tìm thấy yêu cầu hỗ trợ.</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/support')} className="rounded-xl">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const isOpen = ticket.status === 'Open'
  const isReplied = ticket.status === 'AdminReplied'

  return (
    <div className="mx-auto max-w-4xl flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-white/10 bg-[#131b26] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b0f17]/40 px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/support')}
            className="rounded-xl hover:bg-white/5"
            aria-label="Quay lại danh sách hỗ trợ"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate sm:text-lg">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground">
              Mã: <span className="font-mono text-slate-400">{ticket.id.slice(0, 12)}...</span> · Tạo lúc:{' '}
              {new Date(ticket.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0',
            isOpen && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            isReplied && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            !isOpen && !isReplied && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isOpen && 'bg-amber-400 animate-pulse',
              isReplied && 'bg-emerald-400',
              !isOpen && !isReplied && 'bg-slate-400',
            )}
          />
          {isOpen ? 'Chờ Admin phản hồi' : isReplied ? 'Admin đã phản hồi' : 'Đã đóng'}
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {ticket.messages?.map((msg) => {
          const isMe = msg.senderId === user?.id
          const isAdmin = msg.sender?.role === 'Admin'

          return (
            <div
              key={msg.id}
              className={cn('flex items-start gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm',
                  isAdmin
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : isMe
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/10 text-slate-300',
                )}
              >
                {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={cn(
                  'flex max-w-[85%] sm:max-w-[75%] flex-col gap-1 rounded-2xl p-4 shadow-sm text-sm',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : isAdmin
                    ? 'bg-[#182333] border border-cyan-500/30 text-white rounded-tl-sm'
                    : 'bg-[#0b0f17] border border-white/10 text-foreground rounded-tl-sm',
                )}
              >
                <div className="flex items-center justify-between gap-4 text-xs font-bold opacity-80 pb-1 border-b border-white/10">
                  <span>{isAdmin ? 'Quản Trị Viên (Nova Admin)' : isMe ? 'Bạn' : msg.sender?.username}</span>
                  <span className="text-[10px] font-normal opacity-70">
                    {new Date(msg.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed mt-1">{msg.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply Input */}
      {ticket.status !== 'Closed' && (
        <form onSubmit={handleReply} className="border-t border-white/10 bg-[#0b0f17]/40 p-4">
          <div className="flex items-end gap-2.5">
            <textarea
              required
              minLength={2}
              maxLength={2000}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              placeholder="Nhập tin nhắn phản hồi tiếp theo..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleReply(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl font-bold shadow-md shadow-primary/20"
              disabled={replyMutation.isPending || reply.trim().length < 2}
              aria-label="Gửi phản hồi"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SupportDetail
