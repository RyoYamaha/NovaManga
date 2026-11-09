import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/ticket.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, HelpCircle, MessageSquare, MessageSquarePlus, Send, X } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function SupportTickets() {
  const qc = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await ticketService.getMyTickets()).data,
  })

  const createMutation = useMutation({
    mutationFn: () => ticketService.createTicket({ subject, body }),
    onSuccess: () => {
      setIsCreating(false)
      setSubject('')
      setBody('')
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (subject.length >= 5 && body.length >= 10) {
      createMutation.mutate()
    }
  }

  const list = data ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Hỗ Trợ & Khiếu Nại</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Gửi phản hồi, yêu cầu trợ giúp kỹ thuật hoặc khiếu nại tới Ban Quản Trị Nova Manga.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreating(!isCreating)}
          className={cn(
            'rounded-xl font-bold shadow-sm',
            isCreating ? 'border-white/10 bg-white/5 text-foreground hover:bg-white/10' : 'shadow-primary/20',
          )}
        >
          {isCreating ? (
            <>
              <X className="mr-1.5 h-4 w-4" /> Đóng mẫu gửi
            </>
          ) : (
            <>
              <MessageSquarePlus className="mr-1.5 h-4 w-4" /> Tạo yêu cầu mới
            </>
          )}
        </Button>
      </div>

      {/* 2. CREATE TICKET FORM */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-xl animate-in fade-in"
        >
          <div>
            <h2 className="text-base font-bold text-white">Gửi yêu cầu hỗ trợ mới</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đội ngũ Admin sẽ phản hồi trong vòng 24 giờ làm việc.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Chủ đề yêu cầu</label>
            <Input
              required
              minLength={5}
              maxLength={200}
              placeholder="Vấn đề bạn đang gặp phải (nạp coin, lỗi đọc, tài khoản...)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 rounded-xl border-white/10 bg-[#0b0f17] text-sm focus-visible:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nội dung chi tiết</label>
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#0b0f17] p-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              placeholder="Mô tả chi tiết nội dung, đính kèm mã giao dịch hoặc thông tin để được hỗ trợ nhanh nhất..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreating(false)}
              className="rounded-xl text-muted-foreground hover:text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || subject.length < 5 || body.length < 10}
              className="rounded-xl font-bold shadow-md shadow-primary/20"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {createMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}
            </Button>
          </div>
        </form>
      )}

      {/* 3. TICKETS LIST */}
      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Đang tải danh sách yêu cầu hỗ trợ...
        </p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 p-16 text-center text-muted-foreground space-y-3">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-white">Bạn chưa có yêu cầu hỗ trợ nào</p>
          <p className="text-xs max-w-sm mx-auto">
            Nếu gặp bất kỳ khó khăn hoặc vấn đề gì trong quá trình trải nghiệm Nova Manga, hãy tạo yêu cầu hỗ trợ ngay.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="mt-2 rounded-xl font-bold"
          >
            <MessageSquarePlus className="mr-1.5 h-4 w-4" /> Tạo yêu cầu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((ticket) => {
            const isOpen = ticket.status === 'Open'
            const isReplied = ticket.status === 'AdminReplied'

            return (
              <Link
                key={ticket.id}
                to={`/support/${ticket.id}`}
                className="group block rounded-2xl border border-white/10 bg-[#131b26] p-5 shadow-sm transition-all hover:border-primary/40 hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors text-base truncate">
                      {ticket.subject}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cập nhật lần cuối: {new Date(ticket.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
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

                    <span className="text-xs font-bold text-slate-400">
                      {ticket._count?.messages ?? 0} tin nhắn
                    </span>

                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SupportTickets
