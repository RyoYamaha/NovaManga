import { useState } from 'react'
import { Bot, Check, Copy, User } from 'lucide-react'
import { AiMarkdown } from './AiMarkdown'
import type { AiChatMessage } from '@/features/ai/types/ai'

interface Props {
  message: AiChatMessage
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export function AiMessageItem({ message }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard write failures
    }
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-primary/20 bg-primary/10 text-primary'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`group relative max-w-[85%] rounded-xl px-4 py-3 sm:max-w-[75%] ${
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm border border-white/10 bg-[#202d3d] text-foreground'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <AiMarkdown content={message.content} />
        )}

        {/* Footer info: time & copy */}
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground/75">
          <span>{formatTime(message.createdAt)}</span>
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-white"
              title="Sao chép câu trả lời"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AiMessageItem
