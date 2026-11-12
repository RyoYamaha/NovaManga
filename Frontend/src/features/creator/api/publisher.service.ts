import { api } from '@/lib/api'
import type { Publisher, RegisterPublisherDto } from '@/features/creator/types/publisher'
import type { ContentDetailData, ContentListItem } from '@/types/content'
import type { CreateContentDto, UpdateContentDto } from '@/features/creator/types/author'

export const publisherService = {
  getMe: () => api.get<Publisher>('/publisher/me'),
  register: (data: RegisterPublisherDto, file: File) => {
    const formData = new FormData()
    formData.append('organizationName', data.organizationName)
    formData.append('file', file)
    return api.post<Publisher>('/publisher/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getMyContents: () => api.get<ContentListItem[]>('/publisher/content'),
  getContentDetail: (id: string) => api.get<ContentDetailData>(`/publisher/content/${id}`),
  resubmitContent: (id: string) => api.post(`/publisher/content/${id}/resubmit`),

  createOriginal: async (dto: CreateContentDto) =>
    (await api.post<ContentListItem>('/publisher/content', dto)).data,

  uploadCover: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return (await api.post<{ url: string }>('/publisher/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data
  },

  updateContent: async (id: string, dto: UpdateContentDto) =>
    (await api.patch<ContentListItem>(`/publisher/content/${id}`, dto)).data,

  deleteContent: async (id: string) =>
    (await api.delete(`/publisher/content/${id}`)).data,
  getTranslations: async (contentId: string) =>
    (await api.get<PublisherTranslation[]>(`/publisher/content/${contentId}/translations`)).data,
  setTranslationVisibility: async (
    contentId: string,
    translationId: string,
    hidden: boolean,
    reason?: string,
  ) =>
    (await api.patch<PublisherTranslationVisibilityResponse>(
      `/publisher/content/${contentId}/translations/${translationId}/visibility`,
      { hidden, reason },
    )).data,
}

export interface PublisherTranslation {
  id: string
  title: string
  type: string
  publicationStatus: string
  publisherHidden: boolean
  publisherHiddenReason: string | null
  publisherHiddenAt: string | null
  uploader: { id: string; username: string }
  _count: { chapters: number }
}

export type PublisherTranslationVisibilityResponse = Pick<
  PublisherTranslation,
  | 'id'
  | 'title'
  | 'publicationStatus'
  | 'publisherHidden'
  | 'publisherHiddenReason'
  | 'publisherHiddenAt'
>
