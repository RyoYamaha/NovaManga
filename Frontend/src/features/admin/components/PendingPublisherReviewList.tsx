import { Building2, CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PendingPublisher } from '@/features/admin/types/admin'

interface PendingPublisherReviewListProps {
  publishers: PendingPublisher[]
  isPending: boolean
  onApprove: (publisher: PendingPublisher) => void
  onReject: (publisher: PendingPublisher) => void
}

export function PendingPublisherReviewList({
  publishers,
  isPending,
  onApprove,
  onReject,
}: PendingPublisherReviewListProps) {
  if (publishers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#161e29]/40 p-12 text-center text-slate-400 backdrop-blur-xl">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
        <p className="text-sm font-semibold text-slate-200">
          Không có hồ sơ Publisher nào đang chờ duyệt
        </p>
        <p className="mt-1 text-xs text-slate-500">Tất cả hồ sơ đã được xử lý xong</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {publishers.map((publisher) => (
        <div
          key={publisher.id}
          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#161e29]/90 p-5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{publisher.organizationName}</h3>
                <p className="text-xs text-slate-400">
                  Tài khoản:{' '}
                  {publisher.user
                    ? `${publisher.user.username} (${publisher.user.email})`
                    : publisher.userId}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              {publisher.contactEmail && <span>Email: {publisher.contactEmail}</span>}
              {publisher.taxId && <span>MST: {publisher.taxId}</span>}
              {publisher.websiteUrl && <span>Website: {publisher.websiteUrl}</span>}
            </div>

            {publisher.verificationDocumentUrl ? (
              <div className="pt-1">
                <a
                  href={publisher.verificationDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={
                    /\.pdf(?:$|[?#])/i.test(publisher.verificationDocumentUrl) ? true : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-950/40 px-3 py-1 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-900/50"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>
                    {/\.pdf(?:$|[?#])/i.test(publisher.verificationDocumentUrl)
                      ? 'Tải tài liệu PDF xác minh'
                      : 'Xem tài liệu pháp lý xác minh'}
                  </span>
                </a>
              </div>
            ) : (
              <p className="text-xs font-semibold text-rose-400">Chưa nộp tài liệu xác minh</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => onApprove(publisher)}
              className="rounded-xl bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Duyệt Publisher
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => onReject(publisher)}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Từ chối
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
