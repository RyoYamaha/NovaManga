import { type ReactNode } from 'react'

interface Props {
  content: string
  className?: string
}

/**
 * Format inline markdown tokens: **bold**, *italic*, `code`, and plain text.
 */
function renderInline(text: string): ReactNode[] {
  // Regex to split by bold (**text**), italic (*text*), inline code (`code`)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-primary font-medium"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

/**
 * Lightweight, safe Markdown renderer for AI assistant responses.
 * Formats headers, lists, blockquotes, paragraphs, and inline styles without heavy external dependencies.
 */
export function AiMarkdown({ content, className = '' }: Props) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!currentList) return
    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      )
    } else {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2.5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      )
    }
    currentList = null
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Empty line
    if (!trimmed) {
      flushList()
      continue
    }

    // Unordered list item: - item or * item
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (ulMatch) {
      if (currentList && currentList.type !== 'ul') flushList()
      if (!currentList) currentList = { type: 'ul', items: [] }
      currentList.items.push(ulMatch[1])
      continue
    }

    // Ordered list item: 1. item
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      if (currentList && currentList.type !== 'ol') flushList()
      if (!currentList) currentList = { type: 'ol', items: [] }
      currentList.items.push(olMatch[1])
      continue
    }

    // If we were inside a list, flush it
    flushList()

    // Headers: ###, ##, #
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${blocks.length}`} className="mt-3.5 mb-1.5 text-sm font-bold text-primary">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="mt-4 mb-2 text-base font-bold text-white">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      )
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="mt-4 mb-2 text-lg font-bold text-white">
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      )
      continue
    }

    // Blockquote: > text
    if (trimmed.startsWith('>')) {
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="my-2 border-l-2 border-primary/50 bg-primary/5 px-3 py-1.5 text-xs text-slate-300 italic rounded-r-lg"
        >
          {renderInline(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      )
      continue
    }

    // Regular paragraph
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-1.5 text-sm leading-relaxed text-slate-200">
        {renderInline(trimmed)}
      </p>
    )
  }

  flushList()

  return <div className={`ai-markdown space-y-1 ${className}`}>{blocks}</div>
}

export default AiMarkdown
