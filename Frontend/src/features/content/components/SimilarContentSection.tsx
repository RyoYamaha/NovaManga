import { Sparkles } from 'lucide-react'
import { ContentCard } from '@/components/content/ContentCard'
import type { SimilarContentListItem } from '@/types/content'

interface SimilarContentSectionProps {
  items: SimilarContentListItem[]
}

export function SimilarContentSection({ items }: SimilarContentSectionProps) {
  if (!items.length) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-white">Truyện tương tự</h2>
          <p className="text-xs text-muted-foreground">Cùng thể loại hoặc thẻ với tác phẩm này</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </section>
  )
}
