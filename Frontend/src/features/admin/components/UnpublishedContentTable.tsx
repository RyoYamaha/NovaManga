import { Link } from 'react-router'
import { Eye, ImageOff, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import type { ContentListItem, PublicationStatus } from '@/types/content'

const statusBadges: Record<
  PublicationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PendingApproval: {
    label: 'Chờ phê duyệt',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400 animate-pulse',
  },
  Hidden: {
    label: 'Đang tạm ẩn',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
  Rejected: {
    label: 'Bị từ chối',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  Draft: {
    label: 'Bản nháp',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  Published: {
    label: 'Đã xuất bản',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
}

interface UnpublishedContentTableProps {
  contents: ContentListItem[]
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function UnpublishedContentTable({
  contents,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: UnpublishedContentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161e29]/90 shadow-xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">Tác phẩm</th>
              <th className="p-4">Người đăng</th>
              <th className="p-4">Loại &amp; Nguồn</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contents.map((content) => {
              const badge = statusBadges[content.publicationStatus] ?? {
                label: content.publicationStatus,
                bg: 'bg-white/5',
                text: 'text-slate-300',
                border: 'border-white/10',
                dot: 'bg-slate-400',
              }
              const isNovel = content.type === 'Novel'

              return (
                <tr
                  key={content.id}
                  className="group transition-colors hover:bg-white/[0.03]"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17] shadow-sm">
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
                          state={{ returnTo: '/admin/content/unpublished' }}
                          className="line-clamp-1 block font-bold text-white transition-colors hover:text-primary"
                        >
                          {content.title}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          ID: {content.id.slice(0, 8)}...
                        </span>
                        <p className="mt-1 text-[11px] text-slate-400">
                          AI:{' '}
                          {content.aiModerationStatus === 'Clear'
                            ? 'không gắn cờ'
                            : content.aiModerationStatus === 'Flagged'
                              ? 'cần Admin xem xét'
                              : content.aiModerationStatus === 'Unavailable'
                                ? 'chưa kiểm tra được'
                                : 'chưa có kết quả'}
                        </p>
                        {content.aiModerationReason && (
                          <p
                            title={content.aiModerationReason}
                            className="mt-1 max-w-xs truncate text-[11px] text-amber-300"
                          >
                            Lý do: {content.aiModerationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-slate-200">
                        {content.uploader?.username || 'Ẩn danh'}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isNovel
                            ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-300'
                            : 'border border-sky-400/30 bg-sky-950/60 text-sky-300'
                        }`}
                      >
                        {content.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {content.ownershipTier === 'Licensed'
                          ? 'Bản quyền'
                          : content.ownershipTier === 'Original'
                            ? 'Tự sáng tác'
                            : 'Bản dịch'}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="rounded-xl border-primary/30 bg-primary/5 font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-slate-950"
                    >
                      <Link
                        to={`/admin/content/${content.id}`}
                        state={{ returnTo: '/admin/content/unpublished' }}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Chi tiết
                      </Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
        <span>
          Hiển thị {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, totalCount)} / {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Trước
          </Button>
          <PageJumpInput
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  )
}
