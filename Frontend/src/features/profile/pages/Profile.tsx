import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Building2,
  Check,
  Clock3,
  ImageOff,
  Search,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { Input } from '@/components/ui/input'
import { contentService } from '@/services/content.service'
import type { ContentListItem } from '@/types/content'

const PAGE_SIZE = 12

type ProfileKind = 'user' | 'author' | 'publisher'

function normalizeMatches(search: string, value: string) {
  return value.toLowerCase().includes(search.trim().toLowerCase())
}

function getStoryStatus(status: ContentListItem['storyStatus']) {
  switch (status) {
    case 'Completed':
      return 'Hoàn thành'
    case 'Hiatus':
      return 'Tạm ngưng'
    default:
      return 'Đang ra'
  }
}

export function Profile() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const kind = (searchParams.get('role') as ProfileKind | null) ?? 'user'

  const { data: contentData, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile-content', id],
    enabled: !!id,
    queryFn: async () => (await contentService.getAll({ limit: 200 })).data.items,
  })

  const publishersQuery = useQuery({
    queryKey: ['profile-publishers'],
    queryFn: async () => (await contentService.getPublishers('name')).data,
  })

  const profileItems = useMemo(() => {
    if (!contentData || !id) return [] as ContentListItem[]

    const allItems = [...contentData]
    if (kind === 'publisher') {
      return allItems.filter((item) => item.publisherId === id)
    }

    return allItems.filter((item) => item.uploaderId === id || item.uploader?.id === id)
  }, [contentData, id, kind])

  const profileName = useMemo(() => {
    if (kind === 'publisher') {
      return publishersQuery.data?.find((publisher) => publisher.id === id)?.organizationName ?? 'Publisher'
    }

    const firstItem = profileItems[0]
    return firstItem?.uploader?.username ?? 'Người dùng'
  }, [id, kind, profileItems, publishersQuery.data])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim()
    if (!query) return profileItems
    return profileItems.filter((item) => normalizeMatches(query, item.title))
  }, [profileItems, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const stats = {
    total: profileItems.length,
    manga: profileItems.filter((item) => item.type === 'Manga').length,
    novel: profileItems.filter((item) => item.type === 'Novel').length,
  }

  const badgeLabel =
    kind === 'publisher'
      ? 'Publisher'
      : kind === 'author'
        ? 'Tác giả'
        : 'Người dùng'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-6 md:px-6">
      <div className="rounded-2xl border border-white/10 bg-[#131b26] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
              {kind === 'publisher' ? <Building2 className="h-8 w-8" /> : kind === 'author' ? <User className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{badgeLabel}</p>
              <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{profileName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">{stats.total}</div>
              <div>Tổng tác phẩm</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">{stats.manga}</div>
              <div>Manga</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">{stats.novel}</div>
              <div>Novel</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#131b26] p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Tìm tên truyện..."
            className="h-10 rounded-xl border-white/10 bg-[#0b0f17] pl-8 text-sm"
          />
        </div>
      </div>

      {isLoading && <div className="rounded-2xl border border-white/10 bg-[#131b26] p-8 text-center text-sm text-muted-foreground">Đang tải danh sách tác phẩm...</div>}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Không tải được hồ sơ này.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26] p-10 text-center text-muted-foreground">
          <p className="text-base font-semibold text-white">Chưa có tác phẩm nào cho hồ sơ này.</p>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <h2 className="font-semibold text-white">Tác phẩm đã xuất bản</h2>
            <span className="text-muted-foreground">{filteredItems.length} tác phẩm</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pagedItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#131b26] transition-colors hover:border-white/20"
              >
                <Link
                  to={`/content/${item.id}`}
                  className="group flex h-full gap-3 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17]">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {item.type === 'Manga' ? 'Manga' : 'Novel'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {item.storyStatus === 'Completed' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {getStoryStatus(item.storyStatus)}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white group-hover:text-primary">
                      {item.title}
                    </h3>
                    {item.synopsis && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.synopsis}
                      </p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                      <BookOpen className="h-3.5 w-3.5" />
                      Xem tác phẩm
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                Trang trước
              </Button>
              <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile
