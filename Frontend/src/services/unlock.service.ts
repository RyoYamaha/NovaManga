import { api } from '@/lib/api'

export const CHAPTERS_PER_PACK = 10

export interface ContentAccess {
  contentId: string
  isFree: boolean
  purchaseMode: 'whole' | 'chapter_pack'
  priceCoins: number
  freeChapters: number
  isOwned: boolean
  purchasedPackNumbers: number[]
  purchase: {
    purchasedAt: string
    priceCoins: number
  } | null
}

export interface ContentPurchaseResult {
  purchase: {
    id: string
    contentId: string
    priceCoins: number
    purchasedAt: string
  }
  alreadyOwned: boolean
  balance: number
}

export const unlockService = {
  getContentAccess: (contentId: string) =>
    api.get<ContentAccess>(`/unlock/content/${encodeURIComponent(contentId)}`),
  purchaseContent: (contentId: string) =>
    api.post<ContentPurchaseResult>(
      `/unlock/content/${encodeURIComponent(contentId)}/purchase`,
    ),
  purchaseChapterPack: (contentId: string, chapterNumber: number) =>
    api.post<ContentPurchaseResult>(
      `/unlock/content/${encodeURIComponent(contentId)}/chapters/${chapterNumber}/purchase-pack`,
    ),
}
