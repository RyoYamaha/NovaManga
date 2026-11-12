import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { ContentType, RankingCategory } from '@/types/content'
import { contentService } from '@/services/content.service'
import { readingProgressService } from '@/services/reading-progress.service'
import { ContinueReadingRail, RecommendationsRail } from '@/features/catalog/components/HomeReadingRails'
import { ContentCard } from '@/components/content/ContentCard'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { useAuthStore } from '@/stores/auth-store'

// Số tác phẩm tối đa hiển thị trong lưới ở mỗi trang.
const PAGE_SIZE = 18

// Các danh mục cho bảng "Đang thịnh hành"; value được gửi lên API xếp hạng.
const rankingOptions: { value: RankingCategory; label: string }[] = [
  { value: 'ongoing', label: '🔥 Đang theo dõi' },
  { value: 'popular-manga', label: '📖 Manga nổi bật' },
  { value: 'popular-novel', label: '✨ Novel nổi bật' },
]

const selectClassName =
  'h-10 w-full min-w-0 rounded-xl border border-white/10 bg-[#131b26] px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus:border-primary focus:outline-none sm:w-auto sm:flex-none'

export function Home() {
  // Bộ lọc và số trang được lưu trên URL để có thể tải lại/chia sẻ liên kết.
  const [searchParams, setSearchParams] = useSearchParams()
  // Khởi tạo danh mục xếp hạng từ URL; nếu không hợp lệ thì mặc định là "Đang ra".
  const [rankingCategory, setRankingCategory] = useState<RankingCategory>(() => {
    const initial = searchParams.get('ranking')
    return rankingOptions.find((option) => option.value === initial)?.value ?? 'ongoing'
  })
  const search = searchParams.get('search')?.trim() ?? ''
  const genreId = searchParams.get('genreId') ?? ''
  const tagId = searchParams.get('tagId') ?? ''
  const pageValue = Number(searchParams.get('page') ?? 1)
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const location = useLocation()
  // Thông tin tài khoản dùng để chỉ tải lịch sử và gợi ý cho độc giả đã đăng nhập.
  const user = useAuthStore((state) => state.user)

  // Xác định trang hiện tại là danh mục chung, Manga hay Novel dựa trên đường dẫn.
  const typeFilter: ContentType | undefined = location.pathname.includes('/novel')
    ? 'Novel'
    : location.pathname.includes('/manga')
      ? 'Manga'
      : undefined

  // Tải danh sách tác phẩm chính theo từ khóa, loại, thể loại, tag và trang hiện tại.
  const contentsQuery = useQuery({
    queryKey: ['contents', { search, type: typeFilter, genreId, tagId, page }],
    queryFn: async () => {
      const response = await contentService.getAll({
        search: search || undefined,
        type: typeFilter,
        genreId: genreId || undefined,
        tagId: tagId || undefined,
        page,
        limit: PAGE_SIZE,
        publicationStatus: 'Published',
      })
      return response.data
    },
  })

  // Tải bảng xếp hạng riêng; đổi nút danh mục sẽ đổi queryKey và tải kết quả tương ứng.
  const rankingQuery = useQuery({
    queryKey: ['content-rankings', rankingCategory],
    queryFn: async () =>
      (await contentService.getRankings({ category: rankingCategory, limit: 10 })).data,
  })

  // Gợi ý cá nhân hóa chỉ được gọi khi tài khoản hiện tại là độc giả.
  const recommendationsQuery = useQuery({
    queryKey: ['content-recommendations', user?.id],
    enabled: user?.role === 'Reader',
    queryFn: async () => (await contentService.getRecommendations({ page: 1, limit: 6 })).data,
  })

  // Tải danh sách truyện người đọc có thể tiếp tục từ lần đọc trước.
  const continueReadingQuery = useQuery({
    queryKey: ['reading-history', user?.id],
    enabled: !!user && user.role === 'Reader',
    queryFn: async () => (await readingProgressService.getMyHistory()).data,
  })

  // Tải dữ liệu dùng để điền các bộ chọn và khu vực giới thiệu ở trang chủ.
  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: async () => (await contentService.getGenres()).data,
  })

  const popularTagsQuery = useQuery({
    queryKey: ['tags', 'popular'],
    queryFn: async () => (await contentService.getTags('popular')).data,
  })

  const allTagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await contentService.getTags()).data,
  })

  const popularPublishersQuery = useQuery({
    queryKey: ['publishers', 'popular'],
    queryFn: async () => (await contentService.getPublishers('popular')).data,
  })

  const updateFilters = (updates: Record<string, string>) => {
    // Cập nhật các tham số lọc trên URL; khi đổi bộ lọc thì quay về trang đầu.
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      if (!Object.hasOwn(updates, 'page')) next.delete('page')
      return next
    })
  }

  // Chuẩn bị dữ liệu với giá trị dự phòng để phần giao diện không phải xử lý undefined.
  const items = contentsQuery.data?.items ?? []
  const meta = contentsQuery.data?.meta
  const rankingItems = rankingQuery.data?.items ?? []
  const hasFilters = Boolean(genreId || tagId)
  const historyList = continueReadingQuery.data ?? []

  return (
    // Bố cục chính: danh sách nội dung ở cột lớn, bảng xếp hạng ở cột phụ trên màn hình rộng.
    <div className={`mx-auto grid w-full max-w-[1700px] gap-6 px-3 py-4 sm:px-5 lg:px-6 ${!search ? 'xl:grid-cols-[minmax(0,1fr)_280px]' : ''}`}>
      <div className="order-2 min-w-0 space-y-8 xl:order-1">

      {/* Khu vực đọc tiếp chỉ hiện cho độc giả đã đăng nhập và khi không tìm kiếm. */}
      {user?.role === 'Reader' && !search && (
        <ContinueReadingRail history={historyList} />
      )}

      {/* Gợi ý cá nhân hóa cũng chỉ hiện cho độc giả ở trang khám phá bình thường. */}
      {user?.role === 'Reader' && !search && (
        <RecommendationsRail
          recommendations={recommendationsQuery.data}
          isLoading={recommendationsQuery.isLoading}
          isError={recommendationsQuery.isError}
        />
      )}

      {/* Tiêu đề trang/kết quả tìm kiếm cùng nút quay về trang chủ khi đang tìm. */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {search
                ? `Kết quả tìm kiếm cho: "${search}"`
                : typeFilter === 'Manga'
                  ? 'Tất cả Truyện Tranh (Manga)'
                  : typeFilter === 'Novel'
                    ? 'Tất cả Tiểu Thuyết (Novel)'
                    : 'Khám Phá Tất Cả Tác Phẩm'}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {meta ? `Tổng cộng ${meta.total} tác phẩm đã duyệt và phát hành.` : 'Đang cập nhật'}
            </p>
          </div>
          {search && (
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/">Quay về trang chủ</Link>
            </Button>
          )}
        </div>

        {/* Thanh lọc theo thể loại hoặc tag; các lựa chọn được đồng bộ lên URL. */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/10 bg-[#131b26]/80 p-3 backdrop-blur-md">
          <div className="mr-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Bộ lọc:</span>
          </div>

          <label className="sr-only" htmlFor="genre-filter">Thể loại</label>
          <select
            id="genre-filter"
            aria-label="Lọc theo thể loại"
            className={selectClassName}
            value={genreId}
            onChange={(event) => updateFilters({ genreId: event.target.value })}
          >
            <option value="">Tất cả Thể loại</option>
            {(genresQuery.data ?? []).map((genre) => (
              <option key={genre.id} value={genre.id}>{genre.name}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="tag-filter">Thẻ</label>
          <select
            id="tag-filter"
            aria-label="Lọc theo thẻ"
            className={selectClassName}
            value={tagId}
            onChange={(event) => updateFilters({ tagId: event.target.value })}
          >
            <option value="">Tất cả Thẻ</option>
            {(allTagsQuery.data ?? []).map((tag) => (
              <option key={tag.id} value={tag.id}>#{tag.name}</option>
            ))}
          </select>

          {hasFilters && (
            <Button
              className="h-10 rounded-xl px-3 text-xs"
              variant="ghost"
              size="sm"
              onClick={() => updateFilters({ genreId: '', tagId: '' })}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Trạng thái tải, lỗi và không có kết quả của danh sách tác phẩm. */}
        {contentsQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium">Đang tải danh sách tác phẩm...</p>
          </div>
        )}

        {contentsQuery.isError && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-3 text-base font-semibold text-foreground">Không thể tải danh sách truyện</p>
            <Button className="mt-3 rounded-xl" variant="outline" size="sm" onClick={() => contentsQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {!contentsQuery.isLoading && !contentsQuery.isError && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-base font-semibold text-foreground">
              {search ? `Không tìm thấy truyện phù hợp với "${search}"` : 'Không có truyện nào phù hợp bộ lọc'}
            </p>
            <p className="mt-1 text-xs">Thử thay đổi từ khóa hoặc xóa bớt tiêu chí lọc.</p>
          </div>
        )}

        {!contentsQuery.isLoading && !contentsQuery.isError && items.length > 0 && (
          <>
            {/* Lưới tác phẩm; mỗi thẻ được hiển thị bởi component ContentCard dùng chung. */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>

            {/* Điều hướng phân trang; cập nhật page trên URL để tải đúng nhóm kết quả. */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10 px-4"
                  disabled={page <= 1}
                  onClick={() => updateFilters({ page: String(page - 1) })}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Trang trước
                </Button>
                <PageJumpInput
                  currentPage={page}
                  totalPages={meta.totalPages}
                  onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10 px-4"
                  disabled={page >= meta.totalPages}
                  onClick={() => updateFilters({ page: String(page + 1) })}
                >
                  Trang sau <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Các tag nổi bật và nhà xuất bản giúp khám phá thêm nội dung. */}
      <section className="grid gap-6 border-t border-white/10 pt-8 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">Thẻ thịnh hành</h3>
          <div className="flex flex-wrap gap-2">
            {(popularTagsQuery.data ?? []).slice(0, 12).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => updateFilters({ tagId: tagId === tag.id ? '' : tag.id })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  tagId === tag.id
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'border border-white/10 bg-[#131b26] text-muted-foreground hover:border-white/20 hover:text-foreground'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">Nhà xuất bản đối tác</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(popularPublishersQuery.data ?? []).slice(0, 4).map((pub) => (
              <li key={pub.id} className="rounded-xl border border-white/10 bg-[#131b26] p-3 shadow-sm">
                <p className="truncate text-sm font-semibold text-foreground">{pub.organizationName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pub.publishedContentCount} tác phẩm phát hành
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>

      {!search && (
        // Ẩn bảng xếp hạng khi người dùng đang ở chế độ tìm kiếm.
        <aside className="order-1 min-w-0 overflow-hidden xl:sticky xl:top-16 xl:order-2 xl:self-start">
          <section className="min-w-0 space-y-3.5 rounded-xl border border-white/10 bg-[#131b26] p-4">
          
            {/* Tiêu đề và mô tả ngắn về bảng xếp hạng truyện thịnh hành. */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Đang thịnh hành</h2>
                <p className="mt-1 text-xs text-muted-foreground">Xếp hạng theo lượt đọc gần đây</p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-400/10 text-orange-400">
                <Flame className="h-4 w-4" />
              </span>
            </div>
            {/* Nút chọn loại xếp hạng: đang ra, Manga hoặc Novel. */}
            <div className="flex w-fit gap-1 rounded-lg bg-[#0b0f17]/60 p-1">
              {rankingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRankingCategory(option.value)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    rankingCategory === option.value
                      ? 'bg-[#344357] text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {option.value === 'ongoing' ? 'Đang ra' : option.value === 'popular-manga' ? 'Manga' : 'Novel'}
                </button>
              ))}
            </div>
            {/* Hiển thị trạng thái tải/lỗi hoặc danh sách xếp hạng trả về từ API. */}
            {rankingQuery.isLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải xếp hạng...
              </div>
            ) : rankingQuery.isError ? (
              <p className="py-4 text-sm text-destructive">Không tải được bảng xếp hạng.</p>
            ) : (
              // Mỗi mục mở trang chi tiết truyện; thứ tự trong danh sách là thứ hạng.
              <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-1 xl:divide-y xl:divide-white/10 xl:gap-0">
                {rankingItems.map((item, index) => (
                  <li key={item.id} className="w-[210px] min-w-0 shrink-0 snap-start md:w-auto">
                    <Link
                      to={`/content/${item.id}`}
                      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-[#202d3d] p-2.5 transition-colors hover:border-white/20 hover:bg-[#263547] hover:text-primary xl:rounded-md xl:border-0 xl:bg-transparent xl:px-2 xl:py-3 xl:hover:bg-white/5"
                    >
                      <span className={`w-5 shrink-0 text-right text-sm font-bold tabular-nums ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-card">
                        {item.coverImageUrl ? (
                          <img src={item.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-xs font-medium leading-snug text-slate-200">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {item.activeReaders} lượt đọc
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      )}
    </div>
  )
}

export default Home
