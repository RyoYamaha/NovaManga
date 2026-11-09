import { SharedEditStory } from '@/features/creator/pages/shared/EditStory'

/**
 * Publisher Edit Content (Manga & Novel) - re-uses unified SharedEditStory.
 */
export function PublisherEditContent() {
  return <SharedEditStory role="publisher" />
}

export default PublisherEditContent
