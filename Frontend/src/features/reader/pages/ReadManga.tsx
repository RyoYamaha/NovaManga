import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { contentService } from '@/services/content.service'
import { PaidChapterNotice } from '@/components/content/PaidChapterNotice'
import { CommentSection } from '@/components/comment/CommentSection'
import { useChapterNav } from '@/hooks/useChapterNav'
import { readingProgressService } from '@/services/reading-progress.service'
import { useAuthStore } from '@/stores/auth-store'
import { ImageOff, AlertTriangle } from 'lucide-react'
import { ReportModal } from '@/components/shared/ReportModal'
import { MangaPageFlip } from '../components/MangaPageFlip'

export function ReadManga() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const nav = useChapterNav(id, chapterId)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const markedChapters = useRef(new Set<string>())
  const progressQueryKey = ['reading-progress', user?.id, id]

  const progress = useQuery({
    queryKey: progressQueryKey,
    enabled: !!user && !!id,
    queryFn: () => readingProgressService.getProgress(id!),
  })

  const pages = useQuery({
    queryKey: ['manga-pages', chapterId],
    enabled: !!chapterId,
    retry: (failureCount, error) =>
      !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) &&
      failureCount < 2,
    queryFn: async () =>
      (await contentService.getMangaChapterPages(chapterId!)).data,
  })

  const [pagePosition, setPagePosition] = useState({ chapterId: '', pageIndex: -1 })
  const hasReportedPage = pagePosition.chapterId === chapterId && pagePosition.pageIndex >= 0
  const currentPageIndex = hasReportedPage ? pagePosition.pageIndex : 0
  const sorted = useMemo(
    () => [...(pages.data ?? [])].sort((a, b) => a.pageNumber - b.pageNumber),
    [pages.data],
  )
  const totalPages = sorted.length
  const savedPage = progress.data?.lastChapterId === chapterId
    ? progress.data?.lastPageNumber ?? 1
    : 1

  const savePosition = useMutation({
    mutationFn: (position: { contentId: string; chapterId: string; lastPageNumber: number }) =>
      readingProgressService.savePosition(position.contentId, position),
    onSuccess: (_result, position) => {
      queryClient.setQueryData(
        ['reading-progress', user?.id, position.contentId],
        (current: Awaited<ReturnType<typeof readingProgressService.getProgress>> | undefined) =>
          current
            ? {
                ...current,
                lastChapterId: position.chapterId,
                lastPageNumber: position.lastPageNumber,
              }
            : current,
      )
    },
  })
  const savePositionMutate = savePosition.mutate
  const pendingPosition = useRef<{ contentId: string; chapterId: string; lastPageNumber: number } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushPendingPosition = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = null
    const position = pendingPosition.current
    pendingPosition.current = null
    if (position) savePositionMutate(position)
  }, [savePositionMutate])

  useEffect(() => () => flushPendingPosition(), [chapterId, flushPendingPosition])

  useEffect(() => {
    if (!user || !id || !chapterId || !hasReportedPage || !progress.isSuccess) return
    pendingPosition.current = {
      contentId: id,
      chapterId,
      lastPageNumber: sorted[currentPageIndex]?.pageNumber ?? currentPageIndex + 1,
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushPendingPosition, 500)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
  }, [chapterId, currentPageIndex, flushPendingPosition, hasReportedPage, id, progress.isSuccess, sorted, user])

  const markChapterRead = useMutation({
    mutationFn: ({ contentId, chapterId: completedChapterId, lastPageNumber }: {
      contentId: string
      chapterId: string
      lastPageNumber: number
    }) => readingProgressService.completeChapter(contentId, {
      chapterId: completedChapterId,
      lastPageNumber,
    }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reading-progress'] }),
    onError: (_error, variables) => {
      markedChapters.current.delete(variables.chapterId)
    },
  })
  const completeChapter = markChapterRead.mutate
  const handleReaderPageChange = useCallback((pageIndex: number) => {
    setPagePosition((current) =>
      current.chapterId === chapterId && current.pageIndex === pageIndex
        ? current
        : { chapterId: chapterId ?? '', pageIndex },
    )
  }, [chapterId])
  const refreshLockedChapter = async () => {
    await queryClient.invalidateQueries({ queryKey: ['manga-pages', chapterId] })
  }

  useEffect(() => {
    const currentChapterId = nav.chapter?.id
    const currentChapterPagesLoaded = pages.data?.some((page) => page.chapterId === currentChapterId)
    if (!user || !id || !currentChapterId || !currentChapterPagesLoaded || totalPages === 0 || !hasReportedPage || currentPageIndex !== totalPages - 1) return
    if (markedChapters.current.has(currentChapterId)) return
    markedChapters.current.add(currentChapterId)
    completeChapter({ contentId: id, chapterId: currentChapterId, lastPageNumber: totalPages })
  }, [completeChapter, currentPageIndex, hasReportedPage, id, nav.chapter?.id, pages.data, totalPages, user])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [chapterId])

  if (nav.isLoading || pages.isLoading || (user && progress.isLoading)) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Đang tải...</div>
  }
  if (
    pages.isError &&
    isAxiosError(pages.error) &&
    [401, 403].includes(pages.error.response?.status ?? 0) &&
    id
  ) {
    return (
      <PaidChapterNotice
        contentId={id}
        contentTitle={nav.content?.title}
        priceCoins={nav.content?.priceCoins ?? 0}
        onPurchaseSuccess={refreshLockedChapter}
      />
    )
  }
  if (nav.isError || pages.isError || !id) {
    return <div className="p-12 text-center text-destructive">Không tải được chương này.</div>
  }
  if (!nav.chapter) return <div className="p-12 text-center">Chương không tồn tại hoặc chưa được xuất bản.</div>

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1680px] grid-cols-1 items-start gap-6 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-5">
      
      {/* LEFT: READING AREA */}
      <main className="flex min-w-0 flex-col">
        
        {/* Header Info */}
        <div className="mb-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/80 bg-card/70 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
              {nav.content?.coverImageUrl ? (
                <img src={nav.content.coverImageUrl} alt={nav.content.title} className="w-full h-full object-cover" />
              ) : (
                 <ImageOff className="w-6 h-6 text-muted-foreground/50" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold line-clamp-1">{nav.content?.title}</h1>
              <p className="text-sm text-muted-foreground mb-2">Author Name</p>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
                  Chapter {nav.chapter.number} {nav.chapter.title && `- ${nav.chapter.title}`}
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-destructive hover:underline flex items-center"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" /> Báo cáo
                </button>
              </div>
              {markChapterRead.isError && markChapterRead.variables?.chapterId === nav.chapter.id && (
                <button
                  type="button"
                  onClick={() => {
                    markedChapters.current.delete(nav.chapter!.id)
                    markChapterRead.mutate({ contentId: id, chapterId: nav.chapter!.id, lastPageNumber: totalPages })
                  }}
                  className="mt-2 text-xs text-destructive hover:underline"
                >
                  Không lưu được tiến độ. Thử lại
                </button>
              )}
            </div>
          </div>
          
        </div>
        
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="Chapter"
          targetId={chapterId!}
        />

        {totalPages === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-border/80 bg-[#151b23] text-muted-foreground sm:min-h-[60vh]">
            <ImageOff className="mb-4 h-12 w-12 opacity-20" />
            <p>Chương này chưa có trang nào.</p>
          </div>
        ) : null}
        {user && progress.isError && totalPages > 0 && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Không tải được tiến độ đọc; truyện sẽ mở từ trang đầu.
            <button type="button" className="ml-2 underline" onClick={() => void progress.refetch()}>
              Thử tải lại
            </button>
          </div>
        )}
        {totalPages > 0 && (!user || progress.isSuccess) && (
          <MangaPageFlip
            key={chapterId}
            pages={sorted}
            initialPage={savedPage}
            canPreviousChapter={!!nav.prev}
            canNextChapter={!!nav.next}
            onPageChange={handleReaderPageChange}
            onPreviousChapter={() => nav.prev && navigate(`/content/${id}/read-manga/${nav.prev.id}`)}
            onNextChapter={() => nav.next && navigate(`/content/${id}/read-manga/${nav.next.id}`)}
          />
        )}
        {savePosition.isError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Không lưu được vị trí đọc hiện tại. Vị trí này có thể chưa đồng bộ với tài khoản.
          </p>
        )}
      </main>

      {id && <CommentSection contentId={id} variant="sidebar" />}

    </div>
  )
}

export default ReadManga
