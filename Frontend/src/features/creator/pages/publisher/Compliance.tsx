import { useQuery } from '@tanstack/react-query'
import { publisherService } from '@/features/creator/api/publisher.service'
import { CheckCircle2, Clock, ImageOff, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'

const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Published: {
    label: 'Đã cấp phép & Xuất bản',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  PendingApproval: {
    label: 'Đang thẩm định bản quyền',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  Rejected: {
    label: 'Bị từ chối bản quyền',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
  },
  Draft: {
    label: 'Bản nháp',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
  },
}

export function Compliance() {
  const contentsQuery = useQuery({
    queryKey: ['publisher-contents'],
    queryFn: () => publisherService.getMyContents().then((res) => res.data),
  })

  const list = contentsQuery.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Trung Tâm Bản Quyền & Tuân Thủ</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi tình trạng hồ sơ pháp lý, giấy phép phân phối và bản quyền tác phẩm.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => contentsQuery.refetch()}
          className="rounded-xl border-white/10"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${contentsQuery.isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* 2. TABLE CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
        {contentsQuery.isLoading && (
          <p className="py-14 text-center text-sm text-muted-foreground">Đang tải dữ liệu bản quyền...</p>
        )}

        {contentsQuery.isError && (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-destructive">Không thể tải danh sách tác phẩm.</p>
            <Button size="sm" variant="outline" onClick={() => contentsQuery.refetch()} className="rounded-xl">
              Thử lại
            </Button>
          </div>
        )}

        {!contentsQuery.isLoading && !contentsQuery.isError && list.length === 0 && (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="text-base font-semibold text-white">Chưa có tác phẩm nào</p>
            <p className="text-xs max-w-sm mx-auto">
              Các tác phẩm do bạn đăng ký xuất bản sẽ hiển thị chứng nhận bản quyền tại đây.
            </p>
          </div>
        )}

        {!contentsQuery.isLoading && !contentsQuery.isError && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Tác phẩm</th>
                  <th className="p-4">Cấp bản quyền</th>
                  <th className="p-4">Tình trạng xét duyệt</th>
                  <th className="p-4 text-right">Xác thực pháp lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((item) => {
                  const badge = STATUS_BADGES[item.publicationStatus] ?? {
                    label: item.publicationStatus,
                    bg: 'bg-white/5',
                    text: 'text-slate-300',
                    border: 'border-white/10',
                    dot: 'bg-slate-400',
                  }

                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-white/[0.03]">
                      {/* Title & Cover */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f17] shadow-sm">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <ImageOff className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/content/${item.id}`}
                              className="font-bold text-white hover:text-primary transition-colors line-clamp-1 block"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[11px] text-slate-400">{item.type}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300">
                          {item.ownershipTier === 'Licensed'
                            ? 'Bản quyền NXB'
                            : item.ownershipTier === 'Original'
                            ? 'Tác quyền gốc'
                            : item.ownershipTier}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="p-4 text-right">
                        {item.publicationStatus === 'Published' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực hợp lệ
                          </span>
                        ) : item.publicationStatus === 'PendingApproval' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                            <Clock className="h-3.5 w-3.5" /> Chờ rà soát giấy phép
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
                            <ShieldAlert className="h-3.5 w-3.5" /> Chưa đủ điều kiện
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Compliance
