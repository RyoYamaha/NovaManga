import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  Search,
  BookOpen,
  ImageOff,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
  Coins,
  ShieldCheck,
  User,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { adminService } from '@/features/admin/api/admin.service'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { useAppDialog } from '@/components/common/AppDialogProvider'

export function ContentManagement() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [tierFilter, setTierFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const {
    data: contents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-content'],
    queryFn: adminService.getAllContents,
  })

  const hideContent = useMutation({
    mutationFn: adminService.hideContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] })
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
  })

  const publishedContents = useMemo(() => {
    return contents.filter((content) => content.publicationStatus === 'Published')
  }, [contents])

  const filteredContents = useMemo(() => {
    return publishedContents.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.uploader?.username && c.uploader.username.toLowerCase().includes(q))

      const matchType = typeFilter === 'ALL' || c.type === typeFilter
      const matchTier = tierFilter === 'ALL' || c.ownershipTier === tierFilter

      return matchSearch && matchType && matchTier
    })
  }, [publishedContents, searchQuery, typeFilter, tierFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, typeFilter, tierFilter])

  const totalPages = Math.max(1, Math.ceil(filteredContents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedContents = filteredContents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const confirmHideContent = async (contentId: string, title: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận ẩn truyện',
      description: `Ẩn tác phẩm "${title}" khỏi danh mục công khai? Độc giả sẽ không thể tìm thấy hoặc đọc truyện này cho đến khi được mở lại.`,
      confirmLabel: 'Ẩn truyện',
      tone: 'destructive',
    })
    if (confirmed) hideContent.mutate(contentId)
  }

  // Thống kê nhanh
  const mangaCount = publishedContents.filter((c) => c.type === 'Manga').length
  const novelCount = publishedContents.filter((c) => c.type === 'Novel').length
  const licensedCount = publishedContents.filter((c) => c.ownershipTier === 'Licensed').length

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Nội dung đã xuất bản</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Truyện đã xuất bản
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Quản lý toàn bộ danh mục manga và tiểu thuyết đang hiển thị công khai trên hệ thống.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#161e29] to-transparent p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Đang phát hành công khai</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{publishedContents.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Tổng số tác phẩm độc giả có thể đọc</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-[#161e29]/90 p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400">Phân loại định dạng</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {mangaCount} <span className="text-sm font-normal text-slate-400">Manga</span> · {novelCount}{' '}
            <span className="text-sm font-normal text-slate-400">Novel</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Tỷ lệ cân đối giữa truyện tranh và chữ</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#161e29] to-transparent p-4.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Bản quyền chính thức</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{licensedCount}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Tác phẩm có hợp đồng bản quyền NXB</p>
        </div>
      </div>

      {/* 3. TOOLBAR TÌM KIẾM & BỘ LỌC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên truyện, tác giả, người đăng..."
            className="w-full rounded-2xl border border-white/10 bg-[#161e29] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc định dạng */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Lọc theo định dạng"
            className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả định dạng</option>
            <option value="Manga">Manga</option>
            <option value="Novel">Novel</option>
          </select>

          {/* Lọc bản quyền */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            aria-label="Lọc theo nguồn gốc"
            className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả nguồn gốc</option>
            <option value="Licensed">Bản quyền chính thức</option>
            <option value="Original">Tác phẩm tự sáng tác</option>
            <option value="FanTranslation">Bản dịch cộng đồng</option>
          </select>
        </div>
      </div>

      {/* 4. TABLE VIEW */}
      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-[#161e29]/60 p-12 text-center text-sm text-slate-400 backdrop-blur-xl">
          <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
          Đang tải danh sách tác phẩm...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
          Không thể tải danh sách truyện đã xuất bản. Vui lòng thử lại.
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#161e29]/40 p-12 text-center text-slate-400 backdrop-blur-xl">
          <BookOpen className="mx-auto h-10 w-10 text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">Không tìm thấy tác phẩm phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || typeFilter !== 'ALL' || tierFilter !== 'ALL'
              ? 'Thử điều chỉnh lại từ khóa hoặc bộ lọc'
              : 'Hiện chưa có tác phẩm nào được xuất bản'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161e29]/90 shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tác phẩm</th>
                  <th className="p-4">Người đăng</th>
                  <th className="p-4">Định dạng</th>
                  <th className="p-4">Hình thức & Giá</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pagedContents.map((c) => {
                  const isNovel = c.type === 'Novel'

                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-white/[0.03]">
                      {/* 1. Cover & Title */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17] shadow-sm">
                            {c.coverImageUrl ? (
                              <img
                                src={c.coverImageUrl}
                                alt={c.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/5 text-slate-500">
                                <ImageOff className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/content/${c.id}`}
                              state={{ returnTo: '/admin/content/published' }}
                              className="font-bold text-white hover:text-primary transition-colors line-clamp-1 block"
                            >
                              {c.title}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              Ngày tạo: {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Uploader */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-slate-300 border border-white/10">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-slate-200">
                            {c.uploader?.username || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td className="p-4">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isNovel
                              ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-300'
                              : 'border border-sky-400/30 bg-sky-950/60 text-sky-300'
                          }`}
                        >
                          {c.type}
                        </span>
                      </td>

                      {/* 4. Pricing / Coin */}
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          {typeof c.priceCoins === 'number' && c.priceCoins > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-black/60 px-2 py-0.5 text-xs font-bold text-amber-400">
                              <Coins className="h-3 w-3" /> {c.priceCoins} coin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md border border-teal-400/30 bg-teal-950/60 px-2 py-0.5 text-[11px] font-semibold text-teal-300">
                              Miễn phí
                            </span>
                          )}

                          {c.ownershipTier === 'Licensed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                              <ShieldCheck className="h-3 w-3" /> Bản quyền
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Đã xuất bản
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-slate-950 font-bold transition-all shadow-sm"
                          >
                            <Link
                              to={`/admin/content/${c.id}`}
                              state={{ returnTo: '/admin/content/published' }}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Chi tiết
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={hideContent.isPending}
                            onClick={() => void confirmHideContent(c.id, c.title)}
                            className="rounded-xl border-destructive/25 text-destructive hover:bg-destructive/15 transition-colors"
                          >
                            <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Ẩn truyện
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
            <span>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredContents.length)} / {filteredContents.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-white/10"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                Trước
              </Button>
              <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-white/10"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentManagement
