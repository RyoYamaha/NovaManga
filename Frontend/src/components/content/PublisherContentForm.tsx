import { ContentForm } from './ContentForm'
import type { ContentType } from '@/types/content'

interface Props {
  type: ContentType
}

/**
 * PublisherContentForm re-uses the unified ContentForm with `targetRole="publisher"`.
 * All validation, pricing, tags, and genres are shared to prevent duplicate code.
 */
export function PublisherContentForm({ type }: Props) {
  return <ContentForm type={type} targetRole="publisher" />
}

export default PublisherContentForm
