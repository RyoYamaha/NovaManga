import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authorService } from '@/features/creator/api/author.service'
import { ContentForm } from '@/components/content/ContentForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Check, ImageOff, Languages, RefreshCw, Search } from 'lucide-react'
import type { LicensedBrowseItem } from '@/types/content'

export function UploadTranslation() {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<LicensedBrowseItem | null>(null)

  const list = useQuery({
    queryKey: ['browse-licensed', search],
    enabled: !picked,
    queryFn: () => authorService.browseLicensed(search.trim() || undefined),
  })

  if (picked) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#131b26] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Đăng Bản Dịch Fan-Translation</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dịch tác phẩm gốc: <span className="font-semibold text-primary">{picked.title}</span> ({picked.type})
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicked(null)}
            className="rounded-xl border-white/10"
          >
            Đổi truyện khác
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
          <ContentForm type={picked.type} parentContentId={picked.id} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Languages className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Đăng Ký Bản Dịch Mới</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Chọn tác phẩm được Publisher cấp quyền dịch cộng đồng, sau đó tạo bản dịch tiếng Việt của bạn.
          </p>
        </div>
      </div>

      {/* 2. SEARCH TOOLBAR */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="licensed-search"
          placeholder="Tìm tên truyện Publisher có bản quyền..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-xl border-white/10 bg-[#131b26] pl-10 text-sm focus-visible:ring-primary placeholder:text-muted-foreground/60"
        />
      </div>

      {/* 3. LIST */}
      {list.isLoading && (
        <p className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Đang tải danh sách tác phẩm được cấp quyền...
        </p>
      )}

      {list.isError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-sm font-semibold text-destructive">Không tải được danh sách truyện. Vui lòng thử lại.</p>
          <Button size="sm" variant="outline" onClick={() => void list.refetch()} className="rounded-xl">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Thử lại
          </Button>
        </div>
      )}

      {!list.isLoading && !list.isError && list.data?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/40 p-16 text-center text-muted-foreground space-y-2">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="text-base font-semibold text-white">
            {search.trim()
              ? 'Không tìm thấy truyện phù hợp với từ khóa.'
              : 'Hiện chưa có truyện Publisher nào đủ điều kiện để dịch.'}
          </p>
          <p className="text-xs max-w-sm mx-auto">
            Chỉ truyện bản quyền đã xuất bản, miễn phí và được Publisher bật quyền dịch cộng đồng mới xuất hiện ở đây.
          </p>
        </div>
      )}

      {!!list.data?.length && (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.data.map((content) => (
            <div
              key={content.id}
              className="group flex gap-4 rounded-2xl border border-white/10 bg-[#131b26] p-4 shadow-sm transition-all hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17] shadow-sm">
                {content.coverImageUrl ? (
                  <img
                    src={content.coverImageUrl}
                    alt={content.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                    <ImageOff className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h3 className="line-clamp-1 font-bold text-white group-hover:text-primary transition-colors text-sm">
                    {content.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {content.type}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">Được cấp quyền dịch</span>
                  </div>
                  {content.synopsis && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {content.synopsis}
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <Button
                    size="sm"
                    onClick={() => setPicked(content)}
                    className="w-full rounded-xl font-bold shadow-sm shadow-primary/20"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Chọn truyện này
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UploadTranslation
