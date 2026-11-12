import { Link, useParams } from 'react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  Coins,
  ShieldCheck,
  Layers,
  Clock,
  ExternalLink,
  User,
  Building2,
  Tag,
  ImageOff,
} from 'lucide-react'
import { contentService } from '@/services/content.service'
import { readingProgressService } from '@/services/reading-progress.service'
import { useAuthStore } from '@/stores/auth-store'
import { RatingStars } from '@/components/content/RatingStars'
import { ReportModal } from '@/components/shared/ReportModal'
import { ContentDetailMainColumn } from '@/features/content/components/ContentDetailMainColumn'
import { ContentInformationSidebar } from '@/features/content/components/ContentInformationSidebar'
import { SimilarContentSection } from '@/features/content/components/SimilarContentSection'
import { ContentDetailLoadState } from '@/features/content/components/ContentDetailLoadState'
import { ContentDetailBreadcrumb } from '@/features/content/components/ContentDetailBreadcrumb'
import { ContentDetailActions } from '@/features/content/components/ContentDetailActions'

export function ContentDetail() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const user = useAuthStore((state) => state.user)
  const { id } = useParams<{ id: string }>()

  // 1. Tải chi tiết tác phẩm
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['content', id],
    enabled: !!id,
    retry: (count, err) => !(isAxiosError(err) && err.response?.status === 404) && count < 2,
    queryFn: async () => (await contentService.getDetail(id!)).data,
  })

  // 2. Lấy tiến độ đọc (Lịch sử đọc)
  const progressQuery = useQuery({
    queryKey: ['reading-progress', id],
    enabled: !!user && !!id,
    queryFn: () => readingProgressService.getProgress(id!),
  })

  const similarContentsQuery = useQuery({
    queryKey: ['similar-content', id],
    enabled: !!id,
    queryFn: async () => (await contentService.getSimilar(id!)).data,
  })

  // 3. Xử lý chia sẻ link
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 4. Lọc & sắp xếp chương
  const publishedChapters = useMemo(() => {
    return (data?.chapters || []).filter((c) => c.moderationStatus === 'Published')
  }, [data?.chapters])

  // Chương đầu tiên và chương mới nhất
  const firstChapter = useMemo(() => {
    return publishedChapters.slice().sort((a, b) => a.number - b.number)[0]
  }, [publishedChapters])

  const latestChapter = useMemo(() => {
    return publishedChapters.slice().sort((a, b) => b.number - a.number)[0]
  }, [publishedChapters])

  // Tiến độ đọc
  const completedChapterIds = useMemo(() => {
    return new Set(progressQuery.data?.completedChapterIds ?? [])
  }, [progressQuery.data?.completedChapterIds])

  const lastChapterId = progressQuery.data?.lastChapterId
  const lastReadChapter = useMemo(() => {
    if (!lastChapterId || !publishedChapters.length) return null
    return publishedChapters.find((c) => c.id === lastChapterId) || null
  }, [lastChapterId, publishedChapters])

  const readPath = (chapterId: string) =>
    `/content/${data?.id}/${data?.type === 'Manga' ? 'read-manga' : 'read-novel'}/${chapterId}`

  if (isLoading || isError) {
    return (
      <ContentDetailLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data) return null

  const isNovel = data.type === 'Novel'

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-3 pb-16 pt-2 sm:px-6">
      <ContentDetailBreadcrumb contentType={data.type} title={data.title} />

      {/* 1. CONTENT OVERVIEW */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#202d3d]">
        <div className="flex flex-col gap-6 p-4 sm:p-6 md:flex-row md:items-start md:gap-7">
          {/* Cover Image Frame */}
          <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1a2533] sm:w-52 md:mx-0">
            {data.coverImageUrl ? (
              <img
                src={data.coverImageUrl}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1a2533] text-muted-foreground/40">
                <ImageOff className="h-10 w-10" />
                <span className="text-xs font-bold tracking-wider">NOVA MANGA</span>
              </div>
            )}

            {/* Badges on Cover Image */}
            <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5 items-start">
              <span
                className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${
                  isNovel
                    ? 'border border-emerald-400/40 bg-emerald-950/85 text-emerald-300'
                    : 'border border-sky-400/40 bg-sky-950/85 text-sky-300'
                }`}
              >
                {data.type}
              </span>
            </div>

            {/* Status dot on Cover bottom */}
            <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-black/40 bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  data.storyStatus === 'Completed'
                    ? 'bg-sky-400'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span>{data.storyStatus === 'Completed' ? 'Đã hoàn thành' : 'Đang ra'}</span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  isNovel
                    ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-300'
                    : 'border border-sky-400/30 bg-sky-950/60 text-sky-300'
                }`}
              >
                {data.type}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    data.storyStatus === 'Completed' ? 'bg-sky-400' : 'bg-emerald-400'
                  }`}
                />
                {data.storyStatus === 'Completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}
              </span>

              {data.ownershipTier === 'Licensed' && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-950/70 px-2.5 py-1 text-xs font-semibold text-amber-300 shadow-sm shadow-amber-500/10">
                  <ShieldCheck className="h-3.5 w-3.5" /> Bản quyền chính thức
                </span>
              )}

              {data.freeChapters > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Miễn phí {data.freeChapters} chương đầu
                </span>
              )}

              {typeof data.priceCoins === 'number' && data.priceCoins > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-black/60 px-2.5 py-1 text-xs font-bold text-amber-400 shadow-sm shadow-amber-500/10">
                  <Coins className="h-3.5 w-3.5" /> {data.priceCoins} coin{' '}
                  {data.purchaseMode === 'chapter_pack'
                    ? 'mỗi gói 10 chương'
                    : 'cho toàn bộ truyện'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border border-teal-400/30 bg-teal-950/60 px-2.5 py-1 text-xs font-semibold text-teal-300">
                  Miễn phí hoàn toàn
                </span>
              )}

              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {publishedChapters.length} chương
              </span>
            </div>

            {/* Work Title */}
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-sm leading-tight">
              {data.title}
            </h1>

            {/* Author / Publisher / Date Meta Bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 border border-white/5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="text-slate-400">Đăng bởi:</span>
                <Link to={`/profile/${data.uploader?.id ?? data.uploaderId}?role=author`} className="font-semibold text-white transition-colors hover:text-primary">
                  {data.uploader?.username || 'Ẩn danh'}
                </Link>
              </div>

              {data.publisher && (
                <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 border border-white/5">
                  <Building2 className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-400">NXB:</span>
                  <Link to={`/profile/${data.publisher.id}?role=publisher`} className="font-semibold text-primary transition-colors hover:text-primary/80">
                    {data.publisher.organizationName}
                  </Link>
                </div>
              )}

              {data.updatedAt && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Cập nhật: {new Date(data.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>

            {/* Community Translation Backlink */}
            {data.parentContent && (
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-950/30 p-3 text-xs text-sky-200 backdrop-blur-sm">
                <ExternalLink className="h-4 w-4 shrink-0 text-sky-400" />
                <span>
                  Bản dịch cộng đồng từ tác phẩm gốc:{' '}
                  <Link
                    to={`/content/${data.parentContent.id}`}
                    className="font-bold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                  >
                    {data.parentContent.title}
                  </Link>
                </span>
              </div>
            )}

            {/* Genres & Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(data.genres || []).map(({ genre }) => (
                <span
                  key={genre.id}
                  className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 hover:border-primary/40 cursor-default"
                >
                  {genre.name}
                </span>
              ))}
              {(data.tags || []).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Tag className="h-3 w-3 text-slate-500" />
                  <span>{tag.name}</span>
                </span>
              ))}
            </div>

            {/* Rating Stars & Social Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <RatingStars contentId={data.id} />
            </div>

            <ContentDetailActions
              content={data}
              firstChapter={firstChapter}
              lastReadChapter={lastReadChapter}
              isReader={user?.role === 'Reader'}
              copied={copied}
              readPath={readPath}
              onShare={handleShare}
              onReport={() => setIsReportModalOpen(true)}
            />
          </div>
        </div>
      </section>

      {/* MODAL BÁO CÁO VI PHẠM */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="Content"
        targetId={data.id}
      />

      {/* 2. BODY CONTENT (2-COLUMN MODERN LAYOUT) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* === MAIN COLUMN (8 COLS) === */}
        <ContentDetailMainColumn
          content={data}
          isReader={user?.role === 'Reader'}
          publishedChapters={publishedChapters}
          completedChapterIds={completedChapterIds}
          lastChapterId={lastChapterId}
        />

        {/* === SIDEBAR COLUMN (4 COLS) === */}
        <ContentInformationSidebar
          content={data}
          publishedChapterCount={publishedChapters.length}
          latestChapter={latestChapter}
          readPath={readPath}
        />
      </div>

      <SimilarContentSection items={similarContentsQuery.data ?? []} />
    </div>
  )
}

export default ContentDetail
