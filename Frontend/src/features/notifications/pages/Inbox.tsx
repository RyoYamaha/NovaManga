import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { notificationService } from '@/features/notifications/api/notification.service'
import { getNotificationDisplayMessage } from '@/features/notifications/types/notification'
import { Bell, CheckCheck, Clock, Inbox as InboxIcon } from 'lucide-react'

export function Inbox() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationService.getAll()).data,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['unread-count'] })
  }

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: refresh,
  })

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: refresh,
  })

  const hasUnread = !!notifications?.some((notification) => !notification.isRead)

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-primary" /> Hộp thư thông báo
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cập nhật về chương truyện mới, giao dịch coin, phê duyệt tác phẩm và thông báo hệ thống.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={!hasUnread || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="rounded-xl border-white/10 font-bold gap-2 text-xs"
        >
          <CheckCheck className="w-4 h-4 text-primary" /> Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Clock className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-semibold">Đang tải danh sách thông báo...</span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-xs font-semibold text-rose-400">Không thể tải danh sách thông báo.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      )}

      {notifications && notifications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131b26]/50 py-16 text-center space-y-3">
          <InboxIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-bold text-foreground">Bạn chưa có thông báo nào</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Khi có cập nhật mới về truyện theo dõi, giao dịch nạp coin hoặc xét duyệt, bạn sẽ nhận được thông báo tại đây.
          </p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm divide-y divide-white/5">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              disabled={notification.isRead || markRead.isPending}
              onClick={() => markRead.mutate(notification.id)}
              className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors group ${
                notification.isRead
                  ? 'bg-transparent text-muted-foreground hover:bg-white/[0.02]'
                  : 'bg-primary/[0.04] text-foreground hover:bg-primary/[0.08]'
              }`}
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition-transform ${
                  notification.isRead
                    ? 'bg-transparent border border-white/20'
                    : 'bg-primary ring-4 ring-primary/20 group-hover:scale-125'
                }`}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className={`text-xs leading-relaxed ${notification.isRead ? 'font-medium' : 'font-bold text-foreground'}`}>
                  {getNotificationDisplayMessage(notification.message)}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notification.createdAt).toLocaleString('vi-VN')}</span>
                  {!notification.isRead && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-bold text-primary">
                      Mới
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Inbox
