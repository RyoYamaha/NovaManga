import { isAxiosError } from 'axios'
import { api } from '@/lib/api'

interface ReadingProgressResponse {
  lastChapterId: string
  lastPageNumber?: number | null
  chapterReads: Array<{ chapterId: string }>
}

interface UpdateReadingProgressDto {
  chapterId: string
  lastPageNumber?: number
  completed?: boolean
}

export interface ReadingHistoryItem {
  contentId: string
  lastReadAt: string
  content: {
    id: string
    title: string
    type: 'Manga' | 'Novel'
    coverImageUrl?: string | null
  }
  lastChapter: {
    id: string
    number: number
    title?: string | null
  }
}

export const readingProgressService = {
  getMyHistory: () => api.get<ReadingHistoryItem[]>('/reading-progress'),

  getCompletedChapterIds: async (contentId: string): Promise<string[]> => {
    try {
      const { data } = await api.get<ReadingProgressResponse>(`/reading-progress/${contentId}`)
      return data.chapterReads.map(({ chapterId }) => chapterId)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return []
      throw error
    }
  },

  getProgress: async (
    contentId: string,
  ): Promise<{
    lastChapterId?: string
    lastPageNumber?: number | null
    completedChapterIds: string[]
  }> => {
    try {
      const { data } = await api.get<ReadingProgressResponse>(`/reading-progress/${contentId}`)
      return {
        lastChapterId: data.lastChapterId,
        lastPageNumber: data.lastPageNumber,
        completedChapterIds: data.chapterReads.map(({ chapterId }) => chapterId),
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return { completedChapterIds: [] }
      }
      throw error
    }
  },

  savePosition: (contentId: string, dto: Omit<UpdateReadingProgressDto, 'completed'>) =>
    api.put(`/reading-progress/${contentId}`, { ...dto, completed: false }),

  completeChapter: (contentId: string, dto: Omit<UpdateReadingProgressDto, 'completed'>) =>
    api.put(`/reading-progress/${contentId}`, { ...dto, completed: true }),
}
