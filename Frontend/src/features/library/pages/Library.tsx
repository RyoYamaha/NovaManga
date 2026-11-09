import { useState, useMemo, useEffect } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { BookOpen, Compass, ImageOff, Library as LibraryIcon, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { Input } from '@/components/ui/input'
import { useCollection } from '@/features/library/hooks/useCollection'
import type { ContentType } from '@/types/content'

const TABS: { id: ContentType; label: string }[] = [
  { id: 'Manga', label: 'Truyện tranh (Manga)' },
  { id: 'Novel', label: 'Tiểu thuyết (Novel)' },
]

export function Library() {
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'Reader') {
    return <Navigate to="/" replace />
  }

  return <LibraryContent />
}

function LibraryContent() {
  const [activeTab, setActiveTab] = useState<ContentType>('Manga')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [collectionKind, setCollectionKind] = useState<'all' | 'bookmarks' | 'favorites'>('all')

  const bookmarksCollection = useCollection('bookmarks')
  const favoritesCollection = useCollection('favorites')

  const bookmarkList = bookmarksCollection.data ?? []
  const favoriteList = favoritesCollection.data ?? []
  const list = useMemo(() => {
    const merged = [...bookmarkList, ...favoriteList]
    return merged.filter(
      (entry, index, items) => items.findIndex((candidate) => candidate.contentId === entry.contentId) === index,
    )
  }, [bookmarkList, favoriteList])

  const mangaCount = list.filter((i) => i.content.type === 'Manga').length
  const novelCount = list.filter((i) => i.content.type === 'Novel').length

  const filteredData = useMemo(() => {
    return list.filter((item) => {
      const matchTab = item.content.type === activeTab
      const matchSearch = item.content.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchKind =
        collectionKind === 'all' ||
        (collectionKind === 'bookmarks' && bookmarkList.some((entry) => entry.contentId === item.contentId)) ||
        (collectionKind === 'favorites' && favoriteList.some((entry) => entry.contentId === item.contentId))
      return matchTab && matchSearch && matchKind
    })
  }, [activeTab, bookmarkList, collectionKind, favoriteList, list, searchQuery])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, collectionKind, activeTab])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / 20))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredData.slice((currentPage - 1) * 20, currentPage * 20)

  const isLoading = bookmarksCollection.isLoading || favoritesCollection.isLoading
  const isError = bookmarksCollection.isError || favoritesCollection.isError
  const refetch = () => {
    void bookmarksCollection.refetch()
    void favoritesCollection.refetch()
  }

  const remove = (contentId: string) => {
    if (bookmarkList.some((entry) => entry.contentId === contentId)) {
      void bookmarksCollection.remove.mutateAsync(contentId)
      return
    }
    void favoritesCollection.remove.mutateAsync(contentId)
  }

  const countByCollection = {
    all: list.length,
    bookmarks: bookmarkList.length,
    favorites: favoriteList.length,
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LibraryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Thư Viện Của Tôi</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Bộ sưu tập các tác phẩm bạn đã lưu dấu để theo dõi và đọc lại.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10">
            <Link to="/history">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Lịch sử đọc
            </Link>
          </Button>
          <Button size="sm" asChild className="rounded-xl font-bold">
            <Link to="/">
              <Compass className="mr-1.5 h-3.5 w-3.5" /> Khám phá thêm
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. TABS & SEARCH TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#0b0f17] p-1 border border-white/5">
          {TABS.map((t) => {
            const isActive = activeTab === t.id
            const count = t.id === 'Manga' ? mangaCount : novelCount
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm trong thư viện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl border-white/10 bg-[#0b0f17] pl-8 text-xs placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#131b26] p-2">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'bookmarks', label: 'Đánh dấu' },
          { id: 'favorites', label: 'Yêu thích' },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setCollectionKind(filter.id as 'all' | 'bookmarks' | 'favorites')
              setPage(1)
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              collectionKind === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {filter.label} ({countByCollection[filter.id as 'all' | 'bookmarks' | 'favorites']})
          </button>
        ))}
      </div>

      {/* 3. CONTENT LIST */}
      {isLoading && (
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Đang tải danh sách tác phẩm...
        </div>
      )}

      {isError && (
        <div className="py-12 text-center space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive">Không thể tải dữ liệu thư viện.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredData.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 py-16 text-center text-muted-foreground space-y-3">
          <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-white">
            {searchQuery
              ? `Không tìm thấy tác phẩm "${searchQuery}"`
              : `Chưa có bộ ${activeTab.toLowerCase()} nào được lưu`}
          </p>
          <p className="text-xs max-w-sm mx-auto">
            Khi duyệt truyện, bấm nút "Lưu truyện" để dễ dàng theo dõi các tập mới nhất tại đây.
          </p>
          <Button asChild size="sm" className="mt-2 rounded-xl font-bold">
            <Link to={activeTab === 'Manga' ? '/manga' : '/novel'}>
              Khám phá {activeTab} ngay
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredData.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
            <div className="divide-y divide-white/5">
              {pageItems.map((e) => {
                const c = e.content
                return (
                  <div
                    key={e.id}
                    className="group flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link
                      to={`/content/${c.id}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17] shadow-sm">
                        {c.coverImageUrl ? (
                          <img
                            src={c.coverImageUrl}
                            alt={c.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <ImageOff className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate text-sm sm:text-base">
                          {c.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {c.type}
                          </span>
                          <span>·</span>
                          <span className="text-[11px] text-slate-400">
                            {c.storyStatus === 'Completed'
                              ? 'Đã hoàn thành'
                              : c.storyStatus === 'Hiatus'
                              ? 'Tạm ngưng'
                              : 'Đang tiến hành'}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 border-t border-white/5 sm:pt-0 sm:border-0">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="rounded-xl border-white/10 hover:border-primary/40 text-xs"
                      >
                        <Link to={`/content/${c.id}`}>
                          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-primary" /> Chi tiết
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400"
                        aria-label="Xóa khỏi thư viện"
                        disabled={bookmarksCollection.remove.isPending || favoritesCollection.remove.isPending}
                        onClick={() => remove(e.contentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl"
              >
                Trang trước
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                <span className="text-xs text-muted-foreground">· {filteredData.length} tác phẩm</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-xl"
              >
                Trang sau
              </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Library
