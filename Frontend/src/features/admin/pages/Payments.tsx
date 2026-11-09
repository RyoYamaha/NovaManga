import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import {
  financeService,
  type AdminBankTransaction,
  type AdminPaymentOrder,
  type BankSettings,
} from '@/services/finance.service'
import { BankTransactionsPanel } from '@/features/admin/components/BankTransactionsPanel'
import { BankSettingsForm, type BankSettingsFormValues } from '@/features/admin/components/BankSettingsForm'
import { PendingPaymentOrdersPanel } from '@/features/admin/components/PendingPaymentOrdersPanel'

const EMPTY_SETTINGS: BankSettingsFormValues = {
  bankName: '',
  bankBin: '',
  bankAccountNumber: '',
  bankAccountName: '',
}
const PAGE_SIZE = 20

function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) {
      return message.join(', ')
    }
    if (message) {
      return message
    }
  }

  return fallback
}

export function Payments() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const [transactionStatus, setTransactionStatus] = useState('')
  const [transactionPage, setTransactionPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [assigningTransactionId, setAssigningTransactionId] = useState('')
  const [assignOrderId, setAssignOrderId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const settingsQuery = useQuery({
    queryKey: ['admin', 'payment-settings'],
    queryFn: async () => (await financeService.getBankSettings()).data,
  })

  useEffect(() => {
    if (settingsQuery.data && !settingsLoaded) {
      setSettingsForm({
        bankName: settingsQuery.data.bankName ?? '',
        bankBin: settingsQuery.data.bankBin ?? '',
        bankAccountNumber: settingsQuery.data.bankAccountNumber ?? '',
        bankAccountName: settingsQuery.data.bankAccountName ?? '',
      })
      setSettingsLoaded(true)
    }
  }, [settingsLoaded, settingsQuery.data])

  const ordersQuery = useQuery({
    queryKey: ['admin', 'payment-orders', ordersPage],
    queryFn: async () =>
      (await financeService.getAdminPaymentOrders(ordersPage, PAGE_SIZE)).data,
    refetchInterval: 10_000,
  })

  const orderOptionsQuery = useQuery({
    queryKey: ['admin', 'payment-order-options'],
    queryFn: async () => (await financeService.getAdminPaymentOrders(1, 100)).data,
    enabled: Boolean(assigningTransactionId),
  })

  const transactionsQuery = useQuery({
    queryKey: ['admin', 'bank-transactions', transactionStatus, transactionPage],
    queryFn: async () =>
      (
        await financeService.getAdminBankTransactions(
          transactionStatus || undefined,
          transactionPage,
          PAGE_SIZE,
        )
      ).data,
    refetchInterval: 10_000,
  })

  const matchingTransactionsQuery = useQuery({
    queryKey: ['admin', 'bank-transactions', 'Unmatched', 'payment-order-matches'],
    queryFn: async () =>
      (await financeService.getAdminBankTransactions('Unmatched', 1, 100)).data,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    const totalPages = ordersQuery.data?.totalPages
    if (totalPages !== undefined && ordersPage > totalPages) {
      setOrdersPage(Math.max(1, totalPages))
    }
  }, [ordersPage, ordersQuery.data?.totalPages])

  useEffect(() => {
    const totalPages = transactionsQuery.data?.totalPages
    if (totalPages !== undefined && transactionPage > totalPages) {
      setTransactionPage(Math.max(1, totalPages))
    }
  }, [transactionPage, transactionsQuery.data?.totalPages])

  const refreshAdminPayments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-orders'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-order-options'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'bank-transactions'] }),
    ])
  }

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Omit<BankSettings, 'configured'>) =>
      financeService.updateBankSettings(settings),
    onSuccess: async () => {
      setSuccessMessage('Đã cập nhật tài khoản nhận tiền nạp.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payment-settings'] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: (input: { transactionId: string; orderId: string; reason: string }) =>
      financeService.assignBankTransaction(input.transactionId, input.orderId, input.reason),
    onSuccess: async () => {
      setAssigningTransactionId('')
      setAssignOrderId('')
      setAssignReason('')
      setSuccessMessage('Đã đối soát giao dịch và cập nhật ví.')
      await refreshAdminPayments()
    },
  })

  const manualConfirmMutation = useMutation({
    mutationFn: (order: AdminPaymentOrder) =>
      financeService.confirmPaymentOrderManually(order.id, order.expectedAmount),
    onSuccess: async () => {
      setSuccessMessage('Đã xác nhận thủ công và cộng coin cho người dùng.')
      await refreshAdminPayments()
    },
  })

  const submitSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentSettings = settingsQuery.data
    if (
      currentSettings &&
      (!currentSettings.configured ||
        currentSettings.bankName !== settingsForm.bankName ||
        currentSettings.bankBin !== settingsForm.bankBin ||
        currentSettings.bankAccountNumber !== settingsForm.bankAccountNumber ||
        currentSettings.bankAccountName !== settingsForm.bankAccountName)
    ) {
      const confirmed = await confirm({
        title: 'Xác nhận thay đổi tài khoản nhận tiền',
        description: 'Cập nhật tài khoản ngân hàng dùng để nhận tiền nạp coin? Thay đổi này sẽ ảnh hưởng đến các đơn nạp mới.',
        confirmLabel: 'Cập nhật tài khoản',
      })
      if (!confirmed) return
    }
    setSuccessMessage('')
    updateSettingsMutation.mutate(settingsForm)
  }

  const submitAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (assigningTransactionId && assignOrderId && assignReason.trim().length >= 3) {
      const selectedOrder = ordersQuery.data?.items.find((order) => order.id === assignOrderId)
      const confirmed = await confirm({
        title: 'Xác nhận đối soát giao dịch',
        description: `Gán giao dịch ngân hàng này vào đơn${selectedOrder ? ` ${selectedOrder.transferCode} của ${selectedOrder.user.username}` : ''}? Thao tác sẽ cập nhật ví của người dùng.`,
        confirmLabel: 'Xác nhận đối soát',
      })
      if (!confirmed) return
      setSuccessMessage('')
      assignMutation.mutate({
        transactionId: assigningTransactionId,
        orderId: assignOrderId,
        reason: assignReason.trim(),
      })
    }
  }

  const confirmMatchedTransaction = async (
    order: AdminPaymentOrder,
    transaction: AdminBankTransaction,
  ) => {
    const confirmed = await confirm({
      title: 'Xác nhận giao dịch khớp sao kê',
      description: `Giao dịch ${transaction.externalId} khớp mã đơn ${order.transferCode}, số tiền ${formatVnd(transaction.transferAmount)} và tài khoản nhận. Xác nhận cộng coin cho ${order.user.username}?`,
      confirmLabel: 'Xác nhận và cộng coin',
    })
    if (!confirmed) return

    setSuccessMessage('')
    assignMutation.mutate({
      transactionId: transaction.id,
      orderId: order.id,
      reason: 'Admin xác nhận sau khi đối chiếu mã đơn, số tiền và tài khoản nhận.',
    })
  }

  const confirmManually = async (order: AdminPaymentOrder) => {
    const confirmed = await confirm({
      title: 'Xác nhận nạp coin thủ công',
      description: `Chỉ xác nhận nếu đã kiểm tra sao kê và nhận đủ ${formatVnd(order.expectedAmount)} cho đơn ${order.transferCode}. ${order.expectedAmount / 1_000} coin sẽ được cộng cho ${order.user.username}. Nếu webhook đã xử lý đơn, hệ thống sẽ từ chối để tránh cộng trùng.`,
      confirmLabel: 'Đã kiểm tra — xác nhận và cộng coin',
    })
    if (!confirmed) return

    setSuccessMessage('')
    manualConfirmMutation.mutate(order)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Banknote className="h-6 w-6" />
          Quản lý nạp coin
        </h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình tài khoản nhận, kiểm tra đơn nạp và đối soát giao dịch ngân hàng.
        </p>
      </header>

      {successMessage && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200" role="status">
          {successMessage}
        </p>
      )}

      <BankSettingsForm
        settings={settingsQuery.data}
        isLoading={settingsQuery.isLoading}
        isError={settingsQuery.isError}
        form={settingsForm}
        isSaving={updateSettingsMutation.isPending}
        errorMessage={updateSettingsMutation.isError
          ? getErrorMessage(updateSettingsMutation.error, 'Không lưu được cấu hình.')
          : undefined}
        onFieldChange={(field, value) =>
          setSettingsForm((current) => ({ ...current, [field]: value }))
        }
        onRetry={() => void settingsQuery.refetch()}
        onSubmit={submitSettings}
      />

      <BankTransactionsPanel
        data={transactionsQuery.data}
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        isFetching={transactionsQuery.isFetching}
        status={transactionStatus}
        page={transactionPage}
        onStatusChange={(status) => {
          setTransactionStatus(status)
          setTransactionPage(1)
        }}
        onPageChange={setTransactionPage}
        onRefresh={() => void transactionsQuery.refetch()}
        assigningTransactionId={assigningTransactionId}
        orderOptions={orderOptionsQuery.data?.items ?? []}
        orderOptionsError={orderOptionsQuery.isError}
        assignOrderId={assignOrderId}
        assignReason={assignReason}
        assignPending={assignMutation.isPending}
        assignErrorMessage={assignMutation.isError
          ? getErrorMessage(assignMutation.error, 'Không gán được giao dịch.')
          : undefined}
        onSelectTransaction={(id) => {
          setAssigningTransactionId(id)
          setAssignOrderId('')
        }}
        onAssignOrderChange={setAssignOrderId}
        onAssignReasonChange={setAssignReason}
        onAssignSubmit={submitAssign}
        onCancelAssign={() => setAssigningTransactionId('')}
      />

      <PendingPaymentOrdersPanel
        data={ordersQuery.data}
        isLoading={ordersQuery.isLoading}
        isError={ordersQuery.isError}
        bankTransactions={matchingTransactionsQuery.data?.items ?? []}
        isCheckingTransactions={matchingTransactionsQuery.isLoading}
        transactionCheckError={matchingTransactionsQuery.isError}
        page={ordersPage}
        isConfirming={assignMutation.isPending || manualConfirmMutation.isPending}
        confirmErrorMessage={assignMutation.isError
          ? getErrorMessage(assignMutation.error, 'Không đối soát được giao dịch.')
          : manualConfirmMutation.isError
            ? getErrorMessage(manualConfirmMutation.error, 'Không xác nhận thủ công được đơn nạp.')
          : undefined}
        onPageChange={setOrdersPage}
        onConfirmMatchedTransaction={(order, transaction) =>
          void confirmMatchedTransaction(order, transaction)
        }
        onConfirmManually={(order) => void confirmManually(order)}
      />
    </div>
  )
}

export default Payments
