import { api } from '@/lib/api'
import type { LibraryEntry } from '@/features/library/types/library'
import type { CollectionKind } from '@/features/library/types/collection'

export const libraryService = {
  getCollection: (kind: CollectionKind) => api.get<LibraryEntry[]>(`/${kind}`),
  add: (kind: CollectionKind, contentId: string) => api.post(`/${kind}`, { contentId }),
  remove: (kind: CollectionKind, contentId: string) => api.delete(`/${kind}/${contentId}`),
}
