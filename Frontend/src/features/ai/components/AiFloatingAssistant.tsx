import { useState, type FormEvent, useEffect } from 'react'
import {
  Bot,
  X,
  Maximize2,
  Send,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { useAiChat } from '@/features/ai/hooks/useAiChat'
import { AiMessageItem } from './AiMessageItem'
import { AiNovelContextCard } from './AiNovelContextCard'
import { AiQuickPrompts } from './AiQuickPrompts'
import { AiQuotaBadge } from './AiQuotaBadge'

interface Props {
  novelId?: string
  novelTitle?: string
}

export function AiFloatingAssistant({ novelId: propNovelId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  // Extract novelId from URL if on /content/:id or /content/:id/read-novel/:chapterId
  const match = location.pathname.match(/\/content\/([a-zA-Z0-9-]+)/)
  const contextNovelId = propNovelId || (match ? match[1] : undefined)

  // Don't show on full /assistant page to avoid redundancy
  const isAssistantPage = location.pathname.startsWith('/assistant')

  const {
    messages,
    input,
    setInput,
    status,
    currentNovel,
    isSending,
    errorMessage,
    messagesEndRef,
    sendMessage,
    startNewChat,
    clearNovelContext,
  } = useAiChat({
    initialContentId: contextNovelId,
  })

  // Whenever drawer opens and there's a novelId, update context if no messages yet
  useEffect(() => {
    if (isOpen && contextNovelId && messages.length === 0) {
      startNewChat(contextNovelId)
    }
  }, [isOpen, contextNovelId, messages.length, startNewChat])

  // Chỉ hiển thị giao diện AI cho user (role 'Reader').
  // Các role khác (Author, Publisher, Admin) hoặc chưa đăng nhập sẽ không hiển thị.
  if (user?.role !== 'Reader' || isAssistantPage) {
    return null
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const isAiDisabled = status && !status.available

  return (
    <>
      {/* Floating Action Button (FAB) - Thiết kế tinh tế, không nhấp nháy */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-13 w-13 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/30 focus:outline-none"
          title="Mở Trợ lý AI Nova"
          aria-label="Mở Trợ lý AI Nova"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Slide-over Drawer / Floating Chat Modal */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#202d3d] sm:inset-y-4 sm:right-4 sm:h-[620px] sm:max-h-[calc(100vh-2rem)] sm:rounded-xl sm:border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3.5 sm:px-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">Trợ lý AI Nova</h3>
                <span className="text-[10px] text-muted-foreground">Tra cứu metadata Novel</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <AiQuotaBadge status={status} />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-white"
                title="Mở toàn màn hình"
              >
                <Link to={contextNovelId ? `/assistant/${contextNovelId}` : '/assistant'}>
                  <Maximize2 className="h-4 w-4" />
                </Link>
              </Button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                title="Đóng trợ lý"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Novel Badge if present */}
          {currentNovel && (
            <div className="border-b border-white/5 bg-white/[0.02] px-3.5 py-2">
              <AiNovelContextCard
                compact
                novelId={currentNovel.id}
                novelTitle={currentNovel.title}
                onClear={clearNovelContext}
              />
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-3.5 sm:p-4">
            {isAiDisabled && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {status.blocked
                    ? 'Tài khoản của bạn hiện đang bị khóa quyền sử dụng AI.'
                    : 'Trợ lý AI hiện đang tạm bảo trì.'}
                </span>
              </div>
            )}

            {messages.length === 0 && !isAiDisabled && (
              <div className="my-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="mt-2.5 text-xs font-semibold text-white">
                  Bạn cần tra cứu thông tin gì?
                </h4>
                <p className="mt-1 px-4 text-[11px] leading-relaxed text-muted-foreground">
                  Hỏi về thể loại, số chương, tình trạng, hoặc gợi ý tiểu thuyết tương tự.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <AiMessageItem key={message.id} message={message} />
            ))}

            {isSending && (
              <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>AI đang tra cứu dữ liệu...</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {!isAiDisabled && (
            <div className="border-t border-white/5 px-3.5 py-2 bg-white/[0.01]">
              <AiQuickPrompts
                hasNovelContext={Boolean(currentNovel)}
                disabled={isSending || status?.limitReached}
                onSelectPrompt={(prompt) => sendMessage(prompt)}
              />
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-2 border-t border-white/10 p-3 sm:p-3.5"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isAiDisabled
                  ? 'Trợ lý AI đang tạm dừng...'
                  : status?.limitReached
                    ? 'Bạn đã hết lượt hỏi hôm nay...'
                    : 'Nhập câu hỏi về tiểu thuyết...'
              }
              disabled={isSending || status?.limitReached || isAiDisabled}
              maxLength={2000}
              className="h-10 rounded-xl border-white/10 bg-[#070b10] px-3 text-xs"
            />
            <Button
              type="submit"
              disabled={
                !input.trim() || isSending || status?.limitReached || isAiDisabled
              }
              className="h-10 w-10 shrink-0 rounded-xl px-0"
              title="Gửi câu hỏi"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}

export default AiFloatingAssistant
