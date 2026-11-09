import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  CircleAlert,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import { AiUserAccessTable } from '@/features/admin/components/AiUserAccessTable'
import { AiUsageSummary } from '@/features/admin/components/AiUsageSummary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import { aiService } from '@/features/ai/api/ai.service'
import type { AiSettings } from '@/features/ai/types/ai'

const LIMIT_PRESETS = [10, 20, 50, 100]
const PAGE_SIZE = 20

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (message) return message
  }
  return 'Đã xảy ra lỗi khi thao tác với cấu hình AI.'
}

export function AiSettings() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [settingsForm, setSettingsForm] = useState<AiSettings>({
    enabled: false,
    dailyLimit: 20,
    systemPrompt: '',
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [successMessage, setSuccessMessage] = useState('')

  const settingsQuery = useQuery({
    queryKey: ['admin', 'ai-settings'],
    queryFn: async () => (await aiService.getSettings()).data,
  })
  const statsQuery = useQuery({
    queryKey: ['admin', 'ai-usage'],
    queryFn: async () => (await aiService.getUsageStats()).data,
  })
  const usersQuery = useQuery({
    queryKey: ['admin', 'ai-users', search],
    queryFn: async () => (await aiService.listUsers(search.trim() || undefined)).data,
  })
  const users = usersQuery.data ?? []
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (settingsQuery.data) setSettingsForm(settingsQuery.data)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: (settings: Partial<AiSettings>) => aiService.updateSettings(settings),
    onSuccess: async () => {
      setSuccessMessage('Đã lưu cấu hình trợ lý AI thành công.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ai-settings'] })
    },
  })

  const blockMutation = useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      blocked ? aiService.blockUser(userId) : aiService.unblockUser(userId),
    onSuccess: async (_result, { blocked }) => {
      setSuccessMessage(
        blocked
          ? 'Đã khóa quyền sử dụng AI của người dùng.'
          : 'Đã mở khóa quyền sử dụng AI của người dùng.',
      )
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ai-users'] })
    },
  })

  const submitSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const current = settingsQuery.data
    if (!current) return

    const coreSettingsChanged =
      current.enabled !== settingsForm.enabled ||
      current.dailyLimit !== Number(settingsForm.dailyLimit)
    if (coreSettingsChanged) {
      const confirmed = await confirm({
        title: 'Xác nhận thay đổi cấu hình AI',
        description: 'Thay đổi công tắc bật/tắt hoặc hạn mức sẽ áp dụng ngay cho toàn bộ người dùng.',
        confirmLabel: 'Lưu thay đổi',
      })
      if (!confirmed) return
    }

    setSuccessMessage('')
    saveMutation.mutate({
      enabled: settingsForm.enabled,
      dailyLimit: Number(settingsForm.dailyLimit),
      systemPrompt: settingsForm.systemPrompt,
    })
  }

  const toggleUser = async (userId: string, username: string, blocked: boolean) => {
    const confirmed = await confirm({
      title: blocked ? 'Mở khóa AI cho người dùng?' : 'Khóa AI của người dùng?',
      description: blocked
        ? `Cho phép ${username} tiếp tục sử dụng Trợ lý AI Nova?`
        : `Tạm dừng quyền dùng Trợ lý AI của ${username}? Tài khoản và các chức năng khác của họ vẫn hoạt động bình thường.`,
      confirmLabel: blocked ? 'Mở khóa AI' : 'Khóa AI',
      tone: blocked ? 'default' : 'destructive',
    })
    if (!confirmed) return
    setSuccessMessage('')
    blockMutation.mutate({ userId, blocked: !blocked })
  }

  const refresh = async () => {
    await Promise.all([settingsQuery.refetch(), statsQuery.refetch(), usersQuery.refetch()])
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Quản trị Trợ lý AI Nova
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình trợ lý AI, kiểm soát chi phí token, theo dõi thống kê và phân quyền người dùng.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          className="rounded-xl border-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </header>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 shadow-sm"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {(settingsQuery.isError ||
        statsQuery.isError ||
        usersQuery.isError ||
        saveMutation.isError ||
        blockMutation.isError) && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive shadow-sm"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {getErrorMessage(
              settingsQuery.error ||
                statsQuery.error ||
                usersQuery.error ||
                saveMutation.error ||
                blockMutation.error,
            )}
          </span>
        </div>
      )}

      <AiUsageSummary enabled={settingsQuery.data?.enabled} stats={statsQuery.data} />

      {/* 2. Cấu hình vận hành */}
      <form
        onSubmit={submitSettings}
        className="space-y-6 rounded-3xl border border-white/10 bg-[#121924]/80 p-6 shadow-xl backdrop-blur-xl"
      >
        <div className="border-b border-white/5 pb-4">
          <h2 className="text-lg font-bold text-white">Cấu hình hoạt động Trợ lý AI</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Quản lý công tắc toàn hệ thống, hạn mức câu hỏi mỗi ngày và câu lệnh chỉ dẫn hệ thống.
          </p>
        </div>

        {settingsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải cấu hình hiện tại...</p>
        ) : (
          <>
            {/* Toggle Switch */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div>
                <span className="block font-semibold text-white">
                  Bật Trợ lý AI trên toàn bộ hệ thống
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Khi tắt, toàn bộ người đọc sẽ không thể gửi câu hỏi và API sẽ phản hồi từ chối.
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settingsForm.enabled}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/20 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
              </label>
            </div>

            {/* Daily limit & presets */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Hạn mức câu hỏi mỗi người dùng / ngày
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={settingsForm.dailyLimit}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      dailyLimit: Number(e.target.value),
                    }))
                  }
                  className="w-36 rounded-xl border-white/10 bg-[#0c121b]"
                />
                <span className="text-xs text-muted-foreground">câu hỏi/ngày</span>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-muted-foreground mr-1">Gợi ý nhanh:</span>
                  {LIMIT_PRESETS.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() =>
                        setSettingsForm((prev) => ({ ...prev, dailyLimit: limit }))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                        settingsForm.dailyLimit === limit
                          ? 'border-primary bg-primary/20 text-primary font-bold'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {limit} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white">
                  Chỉ dẫn hệ thống (System Prompt)
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {settingsForm.systemPrompt.length} / 1000 ký tự
                </span>
              </div>
              <textarea
                required
                maxLength={1000}
                rows={5}
                value={settingsForm.systemPrompt}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, systemPrompt: e.target.value }))
                }
                placeholder="Nhập hướng dẫn phong cách trả lời và quy tắc cho Gemini..."
                className="w-full rounded-2xl border border-white/10 bg-[#0c121b] p-3.5 text-xs sm:text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Mẹo: Hệ thống tự động kèm các ràng buộc quan trọng (chỉ tra cứu metadata Novel, không tiết lộ nội dung chương, không spoil).
              </p>
            </div>

            <Button
              type="submit"
              disabled={saveMutation.isPending || settingsQuery.isLoading}
              className="rounded-xl px-6 font-bold shadow-md shadow-primary/20"
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </>
        )}
      </form>

      <AiUserAccessTable
        users={users}
        pageUsers={pageUsers}
        search={search}
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        isPending={blockMutation.isPending}
        currentPage={currentPage}
        totalPages={totalPages}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        onPageChange={setPage}
        onToggleUser={(user) =>
          void toggleUser(user.id, user.username, user.aiBlocked)
        }
      />
    </div>
  )
}

export default AiSettings
