import { Link } from 'react-router'
import { Coins, Eye, EyeOff, ImageOff, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ContentListItem } from '@/types/content'

interface PublishedContentTableProps {
  contents: ContentListItem[]
  isHiding: boolean
  onHide: (content: ContentListItem) => void
}

export function PublishedContentTable({
  contents,
  isHiding,
  onHide,
}: PublishedContentTableProps) {
  return (
    <table className="w-full text-left text-xs sm:text-sm">
      <thead className="border-b border-white/10 bg-white/3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
        {contents.map((content) => {
          const isNovel = content.type === 'Novel'
          return (
            <tr key={content.id} className="group transition-colors hover:bg-white/3">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative aspect-2/3 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17] shadow-sm">
                    {content.coverImageUrl ? (
                      <img
                        src={content.coverImageUrl}
                        alt={content.title}
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
                      to={`/admin/content/${content.id}`}
                      state={{ returnTo: '/admin/content/published' }}
                      className="block line-clamp-1 font-bold text-white transition-colors hover:text-primary"
                    >
                      {content.title}
                    </Link>
                    <span className="text-[11px] text-slate-400">
                      Ngày tạo: {new Date(content.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </td>

              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium text-slate-200">
                    {content.uploader?.username || 'N/A'}
                  </span>
                </div>
              </td>

              <td className="p-4">
                <span
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    isNovel
                      ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-300'
                      : 'border border-sky-400/30 bg-sky-950/60 text-sky-300'
                  }`}
                >
                  {content.type}
                </span>
              </td>

              <td className="p-4">
                <div className="flex flex-col items-start gap-1">
                  {content.priceCoins > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-black/60 px-2 py-0.5 text-xs font-bold text-amber-400">
                      <Coins className="h-3 w-3" /> {content.priceCoins} coin
                      {content.purchaseMode === 'chapter_pack' ? ' / gói 10 chương' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-teal-400/30 bg-teal-950/60 px-2 py-0.5 text-[11px] font-semibold text-teal-300">
                      Miễn phí
                    </span>
                  )}
                  {content.ownershipTier === 'Licensed' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                      <ShieldCheck className="h-3 w-3" /> Bản quyền
                    </span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Đã xuất bản
                </span>
              </td>

              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="rounded-xl border-primary/30 bg-primary/5 font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-slate-950"
                  >
                    <Link
                      to={`/admin/content/${content.id}`}
                      state={{ returnTo: '/admin/content/published' }}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Chi tiết
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isHiding}
                    onClick={() => onHide(content)}
                    className="rounded-xl border-destructive/25 text-destructive transition-colors hover:bg-destructive/15"
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
  )
}
