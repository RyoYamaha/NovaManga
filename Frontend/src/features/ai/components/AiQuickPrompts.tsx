import { Lightbulb } from 'lucide-react'

interface Props {
  hasNovelContext?: boolean
  disabled?: boolean
  onSelectPrompt: (prompt: string) => void
  className?: string
}

const NOVEL_PROMPTS = [
  'Bộ này nói về gì?',
  'Bộ này có bao nhiêu chương và đọc thử mấy chương?',
  'Ai là tác giả hoặc nhà xuất bản của bộ này?',
  'Tình trạng ra chương hiện tại thế nào?',
  'Gợi ý những bộ tiểu thuyết có nội dung tương tự bộ này',
]

const GENERAL_PROMPTS = [
  'Gợi ý tiểu thuyết huyền huyễn hot nhất hiện nay',
  'Tìm tiểu thuyết đã hoàn thành có đánh giá cao',
  'Truyện nào đọc thử được nhiều chương nhất?',
  'Quy tắc đọc và mở khóa chương trên NovaManga thế nào?',
  'Tìm tiểu thuyết thể loại Phiêu lưu / Isekai',
]

export function AiQuickPrompts({
  hasNovelContext = false,
  disabled = false,
  onSelectPrompt,
  className = '',
}: Props) {
  const prompts = hasNovelContext ? NOVEL_PROMPTS : GENERAL_PROMPTS

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar ${className}`}>
      <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
        <Lightbulb className="h-3.5 w-3.5" />
        <span>Gợi ý:</span>
      </span>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPrompt(prompt)}
          className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}

export default AiQuickPrompts
