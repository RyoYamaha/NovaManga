import { useState } from 'react'
import { BookOpen, MessageSquare, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AiChatSession } from '@/features/ai/types/ai'

interface Props {
  sessions?: AiChatSession[]
  activeSessionId?: string
  isLoading?: boolean
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
  className?: string
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d)
    }
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d)
  } catch {
    return ''
  }
}

export function AiSessionSidebar({
  sessions = [],
  activeSessionId,
  isLoading = false,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  className = '',
}: Props) {
  const [search, setSearch] = useState('')

  const filteredSessions = sessions.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const novelTitle = s.novel?.title?.toLowerCase() ?? ''
    const firstMsg = s.messages[0]?.content?.toLowerCase() ?? ''
    return novelTitle.includes(q) || firstMsg.includes(q)
  })

  return (
    <div className={`flex flex-col bg-[#1a2533] ${className}`}>
      {/* Top Action */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 hover:text-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="font-semibold text-xs sm:text-sm">Đoạn chat mới</span>
        </Button>

        {sessions.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm lịch sử..."
              className="h-8 rounded-lg pl-8 pr-2 text-xs bg-white/5 border-white/10"
            />
          </div>
        )}
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Lịch sử trò chuyện ({sessions.length})
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Đang tải lịch sử...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {search ? 'Không tìm thấy kết quả.' : 'Chưa có cuộc trò chuyện nào.'}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId
            const title =
              session.novel?.title || session.messages[0]?.content || 'Tra cứu Novel'
            const hasNovel = Boolean(session.novelId)

            return (
              <div
                key={session.id}
                className={`group flex items-center gap-1 rounded-xl px-2.5 py-2 transition-all ${
                  isActive
                    ? 'bg-primary/20 text-white font-medium border border-primary/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                >
                  <div
                    className={`mt-0.5 shrink-0 rounded-md p-1 ${
                      hasNovel
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-white/10 text-muted-foreground'
                    }`}
                  >
                    {hasNovel ? (
                      <BookOpen className="h-3.5 w-3.5" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs leading-snug">{title}</p>
                    <span className="block text-[10px] text-muted-foreground/75 mt-0.5">
                      {formatDate(session.updatedAt)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Xóa cuộc trò chuyện"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                  title="Xóa cuộc trò chuyện này"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AiSessionSidebar
