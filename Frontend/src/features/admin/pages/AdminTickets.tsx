import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, RefreshCw, Send, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { ticketService } from '@/services/ticket.service'

export function AdminTickets() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [selectedTicketId, setSelectedTicketId] = useState<string>()
  const [replyText, setReplyText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ticketsQuery = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => (await ticketService.getAllTickets()).data,
    refetchInterval: 10_000,
  })
  const tickets = ticketsQuery.data ?? []
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId)

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedTicketId(undefined)
      return
    }

    const selectedTicketStillExists = tickets.some(
      (ticket) => ticket.id === selectedTicketId,
    )
    if (!selectedTicketStillExists) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [tickets, selectedTicketId])

  const conversationQuery = useQuery({
    queryKey: ['admin-ticket-conversation', selectedTicketId],
    queryFn: async () => (await ticketService.getTicketDetails(selectedTicketId!)).data,
    enabled: !!selectedTicketId,
    refetchInterval: 5_000,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationQuery.data?.messages])

  const replyMutation = useMutation({
    mutationFn: () =>
      ticketService.replyTicket(selectedTicketId!, { body: replyText.trim() }),
    onSuccess: async () => {
      setReplyText('')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['admin-ticket-conversation', selectedTicketId],
        }),
        queryClient.invalidateQueries({ queryKey: ['admin-tickets'] }),
      ])
    },
  })

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (replyText.trim().length >= 2 && selectedTicketId) {
      replyMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Hộp Thư Hỗ Trợ Độc Giả</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tiếp nhận và giải đáp trực tiếp các thắc mắc, sự cố tài khoản và báo lỗi từ người dùng.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => ticketsQuery.refetch()}
          className="rounded-xl border-white/10"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${ticketsQuery.isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* 2. CHAT CONTAINER */}
      <div className="flex h-[calc(100vh-10rem)] min-h-[550px] overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-xl">
        {/* Left List */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0b0f17]/40 sm:w-80">
          <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Yêu cầu hỗ trợ ({tickets.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {ticketsQuery.isLoading && (
              <p className="p-4 text-xs text-muted-foreground">Đang tải danh sách...</p>
            )}

            {ticketsQuery.isError && (
              <div className="space-y-2 p-4">
                <p className="text-xs text-destructive">Không tải được danh sách yêu cầu.</p>
                <Button size="sm" variant="outline" onClick={() => ticketsQuery.refetch()} className="rounded-xl">
                  Thử lại
                </Button>
              </div>
            )}

            {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 && (
              <p className="p-6 text-center text-xs text-muted-foreground">
                Chưa có yêu cầu hỗ trợ nào.
              </p>
            )}

            {tickets.map((ticket) => {
              const latestMessage = ticket.messages?.[0]
              const isSelected = ticket.id === selectedTicketId
              const isOpen = ticket.status === 'Open'

              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors',
                    isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/[0.03]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-xs font-bold text-white">
                      {ticket.user?.username ?? ticket.userId}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(ticket.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-200">{ticket.subject}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="line-clamp-1 text-[11px] text-muted-foreground max-w-[170px]">
                      {latestMessage?.sender?.role === 'Admin' ? 'Bạn: ' : ''}
                      {latestMessage?.body ?? 'Chưa có tin nhắn'}
                    </p>

                    {isOpen && (
                      <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Chờ phản hồi" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right Chat Area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <header className="flex items-center justify-between border-b border-white/10 bg-[#0b0f17]/40 px-6 py-3.5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-white sm:text-base">
                    {selectedTicket.subject}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    Người gửi: <span className="font-semibold text-primary">{selectedTicket.user?.username ?? selectedTicket.userId}</span>
                  </p>
                </div>

                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                    selectedTicket.status === 'Open'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  )}
                >
                  {selectedTicket.status === 'Open' ? 'Chờ Admin phản hồi' : 'Đã phản hồi'}
                </span>
              </header>

              {/* Chat Messages */}
              {conversationQuery.isLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  Đang tải nội dung hội thoại...
                </div>
              ) : conversationQuery.isError || !conversationQuery.data ? (
                <div className="space-y-2 p-6">
                  <p className="text-sm text-destructive">Không tải được hội thoại.</p>
                  <Button size="sm" variant="outline" onClick={() => conversationQuery.refetch()} className="rounded-xl">
                    Thử lại
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {conversationQuery.data.messages?.map((message) => {
                      const isAdminMessage = message.senderId === currentUser?.id

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex items-start gap-3',
                            isAdminMessage ? 'flex-row-reverse' : 'flex-row',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm',
                              isAdminMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/10 text-slate-300',
                            )}
                          >
                            {isAdminMessage ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>

                          <div
                            className={cn(
                              'flex max-w-[85%] sm:max-w-[75%] flex-col gap-1 rounded-2xl p-4 shadow-sm text-sm',
                              isAdminMessage
                                ? 'ml-auto bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-[#0b0f17] border border-white/10 text-foreground rounded-tl-sm',
                            )}
                          >
                            <div className="flex items-center justify-between gap-4 text-xs font-bold opacity-80 pb-1 border-b border-white/10">
                              <span>
                                {isAdminMessage
                                  ? 'Bạn (Admin)'
                                  : message.sender?.username ?? selectedTicket.user?.username}
                              </span>
                              <span className="text-[10px] font-normal opacity-70">
                                {new Date(message.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed mt-1 text-sm">
                              {message.body}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={handleReply}
                    className="border-t border-white/10 bg-[#0b0f17]/40 p-4"
                  >
                    <div className="flex items-end gap-2.5">
                      <textarea
                        required
                        minLength={2}
                        maxLength={2000}
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        placeholder="Nhập tin nhắn giải đáp gửi tới người dùng..."
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (replyText.trim().length >= 2 && selectedTicketId) {
                              replyMutation.mutate()
                            }
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-xl font-bold shadow-md shadow-primary/20"
                        disabled={replyMutation.isPending || replyText.trim().length < 2}
                        aria-label="Gửi phản hồi"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  {replyMutation.isError && (
                    <p className="px-6 pb-3 text-xs text-destructive">
                      Gửi phản hồi thất bại. Vui lòng thử lại.
                    </p>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-semibold">Chọn một cuộc hội thoại từ danh sách bên trái để phản hồi.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminTickets
