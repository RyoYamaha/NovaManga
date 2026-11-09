import { Link } from 'react-router'
import { ChevronRight, Home } from 'lucide-react'
import type { ContentType } from '@/types/content'

interface ContentDetailBreadcrumbProps {
  contentType: ContentType
  title: string
}

export function ContentDetailBreadcrumb({ contentType, title }: ContentDetailBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-400">
      <Link to="/" className="flex items-center gap-1 transition-colors hover:text-white">
        <Home className="h-3.5 w-3.5" />
        <span>Trang chủ</span>
      </Link>
      <ChevronRight className="h-3 w-3 text-slate-600" />
      <Link to={`/?type=${contentType}`} className="transition-colors hover:text-white">
        {contentType === 'Novel' ? 'Tiểu thuyết' : 'Truyện tranh (Manga)'}
      </Link>
      <ChevronRight className="h-3 w-3 text-slate-600" />
      <span className="max-w-[200px] truncate text-slate-200 sm:max-w-md">{title}</span>
    </nav>
  )
}
