import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { contentService } from '@/services/content.service'
import { PaidChapterNotice } from '@/components/content/PaidChapterNotice'
import { CommentSection } from '@/components/comment/CommentSection'
import { useChapterNav } from '@/hooks/useChapterNav'
import { readingProgressService } from '@/services/reading-progress.service'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, ImageOff, AlertTriangle, Settings2 } from 'lucide-react'
import { ReportModal } from '@/components/shared/ReportModal'
import { NovelBookSpread } from '../components/novel/NovelBookSpread'
import { NovelScrollView } from '../components/novel/NovelScrollView'
import { ReaderSettingsPanel } from '../components/novel/ReaderSettingsPanel'
import { useReaderSettings } from '../hooks/useReaderSettings'
import { PageJumpInput } from '@/components/common/PageJumpInput'

export function ReadNovel() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const nav = useChapterNav(id, chapterId)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateSetting, resetSettings } = useReaderSettings()
  const user = useAuthStore((state) => state.user)
  const [readerPosition, setReaderPosition] = useState({
    chapterId: '',
    pageIndex: -1,
    pageCount: 0,
  })

  const hasReportedReaderPage =
    readerPosition.chapterId === chapterId && readerPosition.pageIndex >= 0
  const progressQueryKey = ['reading-progress', user?.id, id]
  const progress = useQuery({
    queryKey: progressQueryKey,
    enabled: !!user && !!id,
    queryFn: () => readingProgressService.getProgress(id!),
  })
  const progressReady = !user || progress.isSuccess || progress.isError
  const savedPositionForChapter = progress.data?.lastChapterId === chapterId
  const savedPage = savedPositionForChapter
    ? progress.data?.lastPageNumber ?? 1
    : 1
  const chapterEndRef = useRef<HTMLDivElement>(null)
  const markedChapters = useRef(new Set<string>())
  const pdfPageRefs = useRef(new Map<number, HTMLImageElement>())
  const restoredPdfChapter = useRef<string | null>(null)
  const [pdfPosition, setPdfPosition] = useState({ chapterId: '', page: 1 })

  const handleReaderPageChange = useCallback((pageIndex: number, pageCount: number) => {
    setReaderPosition((current) =>
      current.chapterId === chapterId &&
      current.pageIndex === pageIndex &&
      current.pageCount === pageCount
        ? current
        : { chapterId: chapterId ?? '', pageIndex, pageCount },
    )
  }, [chapterId])

  // Text content query
  const body = useQuery({
    queryKey: ['novel-content', chapterId],
    enabled: !!chapterId,
    retry: (failureCount, error) =>
      !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) &&
      failureCount < 2,
    queryFn: async () => (await contentService.getNovelChapterText(chapterId!)).data,
  })

  // PDF pages query (if available)
  const pdfPages = useQuery({
    queryKey: ['novel-pdf-pages', chapterId],
    enabled: !!chapterId,
    retry: false,
    queryFn: async () => (await contentService.getNovelChapterPages(chapterId!)).data,
  })
  const hasPdfPages = (pdfPages.data?.length ?? 0) > 0
  const pdfTotalPages = pdfPages.data?.length ?? 0
  const pdfCurrentPage = pdfPosition.chapterId === chapterId ? pdfPosition.page : 1

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
  const schedulePositionSave = useCallback((positionChapterId: string, lastPageNumber: number) => {
    if (!user || !id) return
    pendingPosition.current = { contentId: id, chapterId: positionChapterId, lastPageNumber }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushPendingPosition, 500)
  }, [flushPendingPosition, id, user])

  useEffect(
    () => () => flushPendingPosition(),
    [chapterId, flushPendingPosition, settings.readingMode],
  )

  const markChapterRead = useMutation({
    mutationFn: ({
      contentId,
      chapterId: completedChapterId,
      lastPageNumber,
    }: {
      contentId: string
      chapterId: string
      lastPageNumber?: number
    }) =>
      readingProgressService.completeChapter(contentId, {
        chapterId: completedChapterId,
        lastPageNumber,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reading-progress'] }),
    onError: (_error, variables) => {
      markedChapters.current.delete(variables.chapterId)
    },
  })
  const completeChapter = markChapterRead.mutate
  const markCurrentChapterRead = useCallback(() => {
    const currentChapterId = nav.chapter?.id
    if (!user || !id || !currentChapterId || markedChapters.current.has(currentChapterId)) return
    markedChapters.current.add(currentChapterId)
    completeChapter({ contentId: id, chapterId: currentChapterId })
  }, [completeChapter, id, nav.chapter?.id, user])

  const refreshLockedChapter = async () => {
    await queryClient.invalidateQueries({ queryKey: ['novel-content', chapterId] })
  }

  useEffect(() => {
    const endMarker = chapterEndRef.current
    const currentChapterId = nav.chapter?.id
    if (
      settings.readingMode !== 'pdf' ||
      !endMarker ||
      !user ||
      !id ||
      !currentChapterId ||
      body.data?.chapterId !== currentChapterId
    ) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || markedChapters.current.has(currentChapterId)) return
        markedChapters.current.add(currentChapterId)
        completeChapter({
          contentId: id,
          chapterId: currentChapterId,
          lastPageNumber: pdfTotalPages,
        })
        observer.disconnect()
      },
      { threshold: 0.8 }
    )

    observer.observe(endMarker)
    return () => observer.disconnect()
  }, [body.data, completeChapter, id, nav.chapter?.id, pdfTotalPages, settings.readingMode, user])

  useEffect(() => {
    const currentChapterId = nav.chapter?.id
    if (
      settings.readingMode !== 'flip' ||
      !user ||
      !id ||
      !currentChapterId ||
      readerPosition.chapterId !== currentChapterId ||
      body.data?.chapterId !== currentChapterId ||
      readerPosition.pageCount === 0 ||
      !hasReportedReaderPage ||
      readerPosition.pageIndex !== readerPosition.pageCount - 1 ||
      markedChapters.current.has(currentChapterId)
    ) return

    markedChapters.current.add(currentChapterId)
    completeChapter({
      contentId: id,
      chapterId: currentChapterId,
      lastPageNumber: readerPosition.pageIndex + 1,
    })
  }, [
    body.data,
    completeChapter,
    id,
    nav.chapter?.id,
    readerPosition,
    hasReportedReaderPage,
    user,
    settings.readingMode,
  ])

  useEffect(() => {
    if (
      settings.readingMode !== 'flip' ||
      !user ||
      !id ||
      !chapterId ||
      !progress.isSuccess ||
      !hasReportedReaderPage ||
      readerPosition.pageCount === 0
    ) return
    schedulePositionSave(chapterId, readerPosition.pageIndex + 1)
  }, [
    chapterId,
    hasReportedReaderPage,
    id,
    progress.isSuccess,
    readerPosition,
    schedulePositionSave,
    settings.readingMode,
    user,
  ])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [chapterId])

  useEffect(() => {
    if (
      settings.readingMode !== 'pdf' ||
      !chapterId ||
      !hasPdfPages ||
      !progressReady ||
      restoredPdfChapter.current === chapterId
    ) return

    const page = Math.max(1, Math.min(savedPage, pdfTotalPages))
    restoredPdfChapter.current = chapterId
    setPdfPosition({ chapterId, page })
    requestAnimationFrame(() => {
      pdfPageRefs.current.get(page)?.scrollIntoView({ block: 'start' })
    })
  }, [
    chapterId,
    hasPdfPages,
    pdfTotalPages,
    progressReady,
    savedPage,
    settings.readingMode,
  ])

  useEffect(() => {
    if (
      settings.readingMode !== 'pdf' ||
      !hasPdfPages ||
      !progressReady ||
      restoredPdfChapter.current !== chapterId
    ) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePage = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const pageNumber = Number(visiblePage?.target.getAttribute('data-page-number'))
        if (Number.isSafeInteger(pageNumber) && pageNumber > 0) {
          setPdfPosition({ chapterId: chapterId ?? '', page: pageNumber })
        }
      },
      { threshold: [0.25, 0.5, 0.75] },
    )

    pdfPageRefs.current.forEach((page) => observer.observe(page))
    return () => observer.disconnect()
  }, [chapterId, hasPdfPages, pdfPages.data, progressReady, settings.readingMode])

  useEffect(() => {
    if (
      settings.readingMode !== 'pdf' ||
      !user ||
      !id ||
      !chapterId ||
      !progress.isSuccess ||
      pdfPosition.chapterId !== chapterId
    ) return
    schedulePositionSave(chapterId, pdfPosition.page)
  }, [
    chapterId,
    id,
    pdfPosition,
    progress.isSuccess,
    schedulePositionSave,
    settings.readingMode,
    user,
  ])

  useEffect(() => {
    if (pdfPages.isFetched && !hasPdfPages && settings.readingMode === 'pdf') {
      updateSetting('readingMode', 'flip')
    }
  }, [hasPdfPages, pdfPages.isFetched, settings.readingMode, updateSetting])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (settings.readingMode !== 'pdf') return
      if (e.key === 'ArrowRight' && nav.next) navigate(`/content/${id}/read-novel/${nav.next.id}`)
      if (e.key === 'ArrowLeft' && nav.prev) navigate(`/content/${id}/read-novel/${nav.prev.id}`)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nav, navigate, id, settings.readingMode])

  if (nav.isLoading || body.isLoading || (user && progress.isLoading)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Đang tải chương tiểu thuyết...</p>
      </div>
    )
  }

  if (
    body.isError &&
    isAxiosError(body.error) &&
    [401, 403].includes(body.error.response?.status ?? 0) &&
    id
  ) {
    return (
      <PaidChapterNotice
        contentId={id}
        contentTitle={nav.content?.title}
        priceCoins={nav.content?.priceCoins ?? 0}
        purchaseMode={nav.content?.purchaseMode}
        chapterNumber={nav.chapter?.number}
        onPurchaseSuccess={refreshLockedChapter}
      />
    )
  }

  if (nav.isError || body.isError || !id) {
    return <div className="p-12 text-center text-destructive">Không tải được chương này.</div>
  }

  if (!nav.chapter) {
    return <div className="p-12 text-center">Chương không tồn tại hoặc chưa được xuất bản.</div>
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1680px] grid-cols-1 items-start gap-6 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-5">
      <main className="flex min-w-0 flex-col gap-4">
        {/* Top Control Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#131b26] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted">
              {nav.content?.coverImageUrl ? (
                <img src={nav.content.coverImageUrl} alt={nav.content.title} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-4 w-4 m-auto text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0">
              <Link to={`/content/${id}`} className="truncate font-bold text-base hover:text-primary transition-colors block">
                {nav.content?.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Chương {nav.chapter.number} {nav.chapter.title && `- ${nav.chapter.title}`}
                </span>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-destructive hover:underline inline-flex items-center"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" /> Báo cáo
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings((visible) => !visible)}
              className="rounded-xl border-white/10"
              aria-label="Cài đặt giao diện đọc"
              aria-expanded={showSettings}
            >
              <Settings2 className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Giao diện đọc</span>
            </Button>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => nav.prev && navigate(`/content/${id}/read-novel/${nav.prev.id}`)}
                disabled={!nav.prev}
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-white/10 px-3 text-xs"
                aria-label="Đọc chương trước"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </Button>
              <Button
                onClick={() => nav.next && navigate(`/content/${id}/read-novel/${nav.next.id}`)}
                disabled={!nav.next}
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-white/10 px-3 text-xs"
                aria-label="Đọc chương tiếp theo"
              >
                <span className="hidden sm:inline">Sau</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {showSettings && (
          <ReaderSettingsPanel
            settings={settings}
            hasPdfPages={hasPdfPages}
            onUpdate={updateSetting}
            onReset={resetSettings}
          />
        )}

        {user && progress.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Không tải được tiến độ đọc; chương sẽ mở từ đầu.
            <button type="button" className="ml-2 underline" onClick={() => void progress.refetch()}>
              Thử tải lại
            </button>
          </div>
        )}
        {savePosition.isError && (
          <p role="alert" className="text-sm text-destructive">
            Không lưu được vị trí đọc hiện tại. Vị trí này có thể chưa đồng bộ với tài khoản.
          </p>
        )}

        <section className="min-w-0 overflow-hidden rounded-2xl">
          {settings.readingMode === 'pdf' && hasPdfPages ? (
            <div className="rounded-2xl border border-white/10 bg-[#131b26] p-4 sm:p-6">
              <h2 className="mb-5 border-b border-white/10 pb-4 text-xl font-bold">
                Chương {nav.chapter.number}
                {nav.chapter.title ? `: ${nav.chapter.title}` : ''}
              </h2>
              <div className="mb-4 flex justify-end">
                <PageJumpInput
                  currentPage={pdfCurrentPage}
                  totalPages={pdfTotalPages}
                  onPageChange={(page) => {
                    setPdfPosition({ chapterId: chapterId ?? '', page })
                    pdfPageRefs.current.get(page)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-5">
                {pdfPages.data?.map((page, index) => (
                  <img
                    key={page.id}
                    src={page.imageUrl}
                    alt={`Trang ${page.pageNumber}`}
                    data-page-number={index + 1}
                    ref={(element) => {
                      if (element) pdfPageRefs.current.set(index + 1, element)
                      else pdfPageRefs.current.delete(index + 1)
                    }}
                    className="h-auto max-w-full rounded-lg border border-white/10 shadow-lg"
                  />
                ))}
              </div>
              <div ref={chapterEndRef} aria-hidden="true" className="h-px" />
            </div>
          ) : settings.readingMode === 'scroll' ? (
            <NovelScrollView
              key={chapterId}
              bookTitle={nav.content?.title}
              chapterTitle={nav.chapter.title ?? undefined}
              chapterNumber={nav.chapter.number}
              text={body.data?.textBody ?? ''}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              theme={settings.theme}
              lineSpacing={settings.lineSpacing}
              contentWidth={settings.contentWidth}
              canPreviousChapter={!!nav.prev}
              canNextChapter={!!nav.next}
              onPreviousChapter={() => nav.prev && navigate(`/content/${id}/read-novel/${nav.prev.id}`)}
              onNextChapter={() => nav.next && navigate(`/content/${id}/read-novel/${nav.next.id}`)}
              onReachEnd={markCurrentChapterRead}
            />
          ) : (
            <NovelBookSpread
              key={chapterId}
              bookTitle={nav.content?.title}
              chapterTitle={nav.chapter.title ?? undefined}
              chapterNumber={nav.chapter.number}
              text={body.data?.textBody ?? ''}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              theme={settings.theme}
              lineSpacing={settings.lineSpacing}
              canPreviousChapter={!!nav.prev}
              canNextChapter={!!nav.next}
              onPageChange={handleReaderPageChange}
              initialPage={savedPositionForChapter ? savedPage : 1}
              onPreviousChapter={() => nav.prev && navigate(`/content/${id}/read-novel/${nav.prev.id}`)}
              onNextChapter={() => nav.next && navigate(`/content/${id}/read-novel/${nav.next.id}`)}
            />
          )}
        </section>
      </main>

      {/* RIGHT: COMMENT DISCUSSION SECTION */}
      {id && <CommentSection contentId={id} variant="sidebar" />}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="Chapter"
        targetId={chapterId!}
      />
    </div>
  )
}

export default ReadNovel
