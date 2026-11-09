import type { ContentListItem, ContentType } from '@/types/content'
import type { Publisher } from '@/features/creator/types/publisher'
import type { ChapterContent, ChapterModerationStatus, ChapterPage } from '@/types/chapter'

export type PendingContent = Pick<
  ContentListItem,
  'id' | 'title' | 'synopsis' | 'type' | 'ownershipTier' | 'coverImageUrl' | 'createdAt' | 'uploader'
>

export interface PendingPublisher extends Publisher {
  contactEmail?: string | null
  websiteUrl?: string | null
  taxId?: string | null
  createdAt?: string
  user?: { id: string; username: string; email: string }
}

export interface AdminChapterDetail {
  id: string
  contentId: string
  number: number
  title: string | null
  moderationStatus: ChapterModerationStatus
  aiModerationStatus?: 'Clear' | 'Flagged' | 'Unavailable' | null
  aiModerationReason?: string | null
  aiModeratedAt?: string | null
  content: {
    id: string
    title: string
    type: ContentType
    publicationStatus: string
  }
  chapterContent: ChapterContent | null
  pages: ChapterPage[]
}

export interface AdminPendingChapter {
  id: string
  contentId: string
  number: number
  title: string | null
  content: {
    id: string
    title: string
    type: ContentType
    uploader: { username: string }
  }
}

export interface ReviewQueue {
  pendingContent: PendingContent[]
  pendingPublisher: PendingPublisher[]
}
