import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, RefreshCw, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import { PayoutRequestsTable } from '@/features/admin/components/PayoutRequestsTable'
import { PayoutSettingsPanel } from '@/features/admin/components/PayoutSettingsPanel'
import { financeService } from '@/services/finance.service'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import {
  formatCoins,
  getPayoutErrorMessage,
  getPayoutTransferCode,
} from '@/features/admin/utils/payout'

const PAGE_SIZE = 20

type PayoutRequestView = 'Pending' | 'Processed'

export function Payouts() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [minimumInput, setMinimumInput] = useState('')
  const [selectedRejectId, setSelectedRejectId] = useState('')
  const [selectedTransferId, setSelectedTransferId] = useState('')
  const [copiedTransferCode, setCopiedTransferCode] = useState('')
  const [copyError, setCopyError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestView, setRequestView] = useState<PayoutRequestView>('Pending')
  const [pendingPage, setPendingPage] = useState(1)
  const [processedPage, setProcessedPage] = useState(1)

  const pendingRequestsQuery = useQuery({
    queryKey: ['admin', 'payout-requests', 'Pending', pendingPage],
    queryFn: async () =>
      (await financeService.getAdminPayoutRequests(pendingPage, PAGE_SIZE, 'Pending')).data,
    refetchInterval: 10_000,
  })

  const processedRequestsQuery = useQuery({
    queryKey: ['admin', 'payout-requests', 'Processed', processedPage],
    queryFn: async () =>
      (await financeService.getAdminPayoutRequests(processedPage, PAGE_SIZE, 'Processed')).data,
    refetchInterval: 10_000,
  })

  const requestsQuery =
    requestView === 'Pending' ? pendingRequestsQuery : processedRequestsQuery
  const page = requestView === 'Pending' ? pendingPage : processedPage
  const setPage = requestView === 'Pending' ? setPendingPage : setProcessedPage

  useEffect(() => {
    const totalPages = pendingRequestsQuery.data?.totalPages
    if (totalPages !== undefined && pendingPage > totalPages) {
      setPendingPage(Math.max(1, totalPages))
    }
  }, [pendingPage, pendingRequestsQuery.data?.totalPages])

  useEffect(() => {
    const totalPages = processedRequestsQuery.data?.totalPages
    if (totalPages !== undefined && processedPage > totalPages) {
      setProcessedPage(Math.max(1, totalPages))
    }
  }, [processedPage, processedRequestsQuery.data?.totalPages])

  const minimumQuery = useQuery({
    queryKey: ['admin', 'payout-minimum'],
    queryFn: async () => (await financeService.getAdminPayoutMinimum()).data,
  })

  const refreshPayoutData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-minimum'] }),
    ])
  }

  const updateMinimumMutation = useMutation({
    mutationFn: (minimumCoins: number) =>
      financeService.updateAdminPayoutMinimum(minimumCoins),
    onSuccess: async () => {
      setMinimumInput('')
      setSuccessMessage('Đã cập nhật mức rút tối thiểu.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payout-minimum'] })
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (requestId: string) => financeService.markPayoutPaid(requestId),
    onSuccess: async () => {
      setSuccessMessage('Đã đánh dấu yêu cầu là đã chuyển khoản.')
      await refreshPayoutData()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () =>
      financeService.rejectPayout(selectedRejectId, rejectReason.trim()),
    onSuccess: async () => {
      setSelectedRejectId('')
      setRejectReason('')
      setSuccessMessage('Đã từ chối yêu cầu và giải phóng số coin đã giữ.')
      await refreshPayoutData()
    },
  })

  const submitMinimum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const minimumCoins = Number(minimumInput)
    if (!Number.isSafeInteger(minimumCoins) || minimumCoins < 10) {
      return
    }
    if (minimumQuery.data !== minimumCoins) {
      const confirmed = await confirm({
        title: 'Xác nhận thay đổi mức rút tối thiểu',
        description: `Đặt mức rút tối thiểu mới là ${formatCoins(minimumCoins)} coin? Thay đổi này sẽ ảnh hưởng đến các yêu cầu payout tiếp theo.`,
        confirmLabel: 'Cập nhật mức tối thiểu',
      })
      if (!confirmed) return
    }
    setSuccessMessage('')
    updateMinimumMutation.mutate(minimumCoins)
  }

  const submitReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedRejectId && rejectReason.trim().length >= 3) {
      const confirmed = await confirm({
        title: 'Xác nhận từ chối payout',
        description: 'Từ chối yêu cầu payout này và giải phóng số coin đang giữ?',
        confirmLabel: 'Từ chối yêu cầu',
        tone: 'destructive',
      })
      if (!confirmed) return
      setSuccessMessage('')
      rejectMutation.mutate()
    }
  }

  const markPaid = async (requestId: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận đã chuyển khoản',
      description: 'Bạn đã chuyển khoản ngoài hệ thống và kiểm tra đúng tài khoản người nhận chưa? Chỉ xác nhận sau khi ngân hàng báo giao dịch thành công.',
      confirmLabel: 'Xác nhận đã chuyển',
    })
    if (confirmed) {
      setSuccessMessage('')
      markPaidMutation.mutate(requestId)
    }
  }

  const copyTransferCode = async (requestId: string) => {
    try {
      await navigator.clipboard.writeText(getPayoutTransferCode(requestId))
      setCopiedTransferCode(requestId)
      setCopyError('')
    } catch {
      setCopiedTransferCode('')
      setCopyError('Không thể sao chép nội dung chuyển khoản trên trình duyệt này.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý payout</h1>
        <p className="text-sm text-muted-foreground">
          Xử lý yêu cầu nhận tiền của Author và Publisher sau khi chuyển khoản thủ công.
        </p>
      </header>

      {successMessage && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200" role="status">
          {successMessage}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRequestView('Pending')}
          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
            requestView === 'Pending'
              ? 'border-amber-400/40 bg-amber-400/[0.08]'
              : 'border-white/10 bg-[#131b26] hover:bg-white/[0.04]'
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            <Clock3 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted-foreground">Cần xử lý</span>
            <span className="mt-0.5 block text-2xl font-bold">
              {pendingRequestsQuery.data?.total ?? '—'}
              <span className="ml-2 text-sm font-medium text-muted-foreground">yêu cầu</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRequestView('Processed')}
          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
            requestView === 'Processed'
              ? 'border-emerald-400/40 bg-emerald-400/[0.08]'
              : 'border-white/10 bg-[#131b26] hover:bg-white/[0.04]'
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted-foreground">Đã xử lý</span>
            <span className="mt-0.5 block text-2xl font-bold">
              {processedRequestsQuery.data?.total ?? '—'}
              <span className="ml-2 text-sm font-medium text-muted-foreground">yêu cầu</span>
            </span>
          </span>
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-semibold">
              {requestView === 'Pending' ? 'Yêu cầu đang chờ' : 'Lịch sử đã xử lý'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {requestView === 'Pending'
                ? 'Kiểm tra thông tin ngân hàng, mở QR để chuyển khoản hoặc từ chối yêu cầu.'
                : 'Theo dõi các yêu cầu đã chuyển khoản hoặc bị từ chối.'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => void requestsQuery.refetch()}
            disabled={requestsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${requestsQuery.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-4 pt-3 sm:px-5" role="group" aria-label="Lọc yêu cầu payout">
          <button
            type="button"
            aria-pressed={requestView === 'Pending'}
            onClick={() => setRequestView('Pending')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              requestView === 'Pending'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Đang chờ
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {pendingRequestsQuery.data?.total ?? '—'}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={requestView === 'Processed'}
            onClick={() => setRequestView('Processed')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              requestView === 'Processed'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Đã xử lý
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {processedRequestsQuery.data?.total ?? '—'}
            </span>
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">
            Quy đổi payout: <span className="font-medium text-foreground">1 coin = 1.000 VND</span>
          </p>
          {requestsQuery.isLoading ? (
            <div className="space-y-3 py-4" aria-label="Đang tải yêu cầu payout">
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          ) : requestsQuery.isError ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-6 text-center">
              <p className="text-sm text-destructive">Không tải được yêu cầu payout.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => void requestsQuery.refetch()}
              >
                Thử tải lại
              </Button>
            </div>
          ) : (requestsQuery.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                {requestView === 'Pending'
                  ? 'Không có yêu cầu payout đang chờ.'
                  : 'Chưa có yêu cầu payout nào được xử lý.'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Các yêu cầu sẽ xuất hiện tại đây khi có thay đổi.
              </p>
            </div>
          ) : (
            <PayoutRequestsTable
              requests={requestsQuery.data?.items ?? []}
              showProcessed={requestView === 'Processed'}
              selectedTransferId={selectedTransferId}
              selectedRejectId={selectedRejectId}
              rejectReason={rejectReason}
              copiedTransferCode={copiedTransferCode}
              copyError={copyError}
              isRejectPending={rejectMutation.isPending}
              rejectErrorMessage={
                rejectMutation.isError
                  ? getPayoutErrorMessage(rejectMutation.error, 'Không từ chối được yêu cầu.')
                  : undefined
              }
              isMarkPaidPending={markPaidMutation.isPending}
              markPaidErrorMessage={
                markPaidMutation.isError
                  ? getPayoutErrorMessage(
                      markPaidMutation.error,
                      'Không cập nhật được yêu cầu payout.',
                    )
                  : undefined
              }
              onToggleTransfer={(requestId) =>
                setSelectedTransferId((currentId) => (currentId === requestId ? '' : requestId))
              }
              onStartReject={(requestId) => {
                setSelectedRejectId(requestId)
                setRejectReason('')
              }}
              onRejectReasonChange={setRejectReason}
              onSubmitReject={submitReject}
              onCancelReject={() => setSelectedRejectId('')}
              onCopyTransferCode={(requestId) => void copyTransferCode(requestId)}
              onMarkPaid={(requestId) => void markPaid(requestId)}
            />
          )}

          {requestsQuery.data && requestsQuery.data.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, requestsQuery.data.total)} trong{' '}
                {requestsQuery.data.total} yêu cầu
              </span>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Trang trước
                </Button>
                <PageJumpInput
                  currentPage={page}
                  totalPages={requestsQuery.data.totalPages}
                  onPageChange={setPage}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((current) => Math.min(requestsQuery.data!.totalPages, current + 1))
                  }
                  disabled={page >= requestsQuery.data.totalPages}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Cài đặt payout</h2>
            <p className="text-sm text-muted-foreground">
              Cấu hình mức rút tối thiểu.
            </p>
          </div>
        </div>
        <PayoutSettingsPanel
          minimumInput={minimumInput}
          minimumValue={minimumQuery.data}
          isMinimumPending={updateMinimumMutation.isPending}
          isMinimumLoadError={minimumQuery.isError}
          minimumSaveErrorMessage={
            updateMinimumMutation.isError
              ? getPayoutErrorMessage(updateMinimumMutation.error, 'Không lưu được mức tối thiểu.')
              : undefined
          }
          onMinimumInputChange={setMinimumInput}
          onSubmitMinimum={submitMinimum}
        />
      </section>
    </div>
  )
}

export default Payouts
