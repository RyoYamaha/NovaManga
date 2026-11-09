import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  Coins,
  Wallet as WalletIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WalletTransactionHistory } from '@/features/wallet/components/WalletTransactionHistory'
import { ActiveDepositOrder } from '@/features/wallet/components/ActiveDepositOrder'
import {
  financeService,
  type CreatedPaymentOrder,
} from '@/services/finance.service'
import type { DepositOrderDisplay } from '@/features/wallet/types/wallet'

const DEPOSIT_PRESETS = [50_000, 100_000, 200_000, 500_000]
const POLL_INTERVAL_MS = 5_000
const WALLET_HISTORY_PAGE_SIZE = 10
function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

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

export function Wallet() {
  const queryClient = useQueryClient()
  const [amountInput, setAmountInput] = useState('50000')
  const [activeOrderId, setActiveOrderId] = useState(
    () => sessionStorage.getItem('active-payment-order-id') ?? '',
  )
  const [copiedField, setCopiedField] = useState('')
  const [copyError, setCopyError] = useState('')
  const [page, setPage] = useState(1)
  const amountVnd = Number(amountInput)

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await financeService.getWalletBalance()).data,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  })

  const transactionsQuery = useQuery({
    queryKey: ['wallet', 'transactions', page],
    queryFn: async () =>
      (await financeService.getWalletTransactions(page, WALLET_HISTORY_PAGE_SIZE)).data,
  })

  const depositMutation = useMutation({
    mutationFn: () => financeService.createDeposit(amountVnd),
    onSuccess: async ({ data }) => {
      setActiveOrderId(data.id)
      sessionStorage.setItem('active-payment-order-id', data.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      ])
    },
  })

  const orderQuery = useQuery({
    queryKey: ['payment-order', activeOrderId],
    enabled: activeOrderId.length > 0,
    queryFn: async () => (await financeService.getPaymentOrder(activeOrderId)).data,
    refetchInterval: (query) =>
      query.state.data?.status === 'Paid' ? false : POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
  })

  useEffect(() => {
    if (orderQuery.data?.status === 'Paid') {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      ])
    }
  }, [orderQuery.data?.status, queryClient])

  useEffect(() => {
    if (!copiedField) {
      return
    }

    const timeout = window.setTimeout(() => setCopiedField(''), 1_800)
    return () => window.clearTimeout(timeout)
  }, [copiedField])

  const expectedCoins = useMemo(() => {
    if (!Number.isSafeInteger(amountVnd) || amountVnd < 0) {
      return 0
    }
    return amountVnd / 1_000
  }, [amountVnd])

  const handleCreateDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      !Number.isSafeInteger(amountVnd) ||
      amountVnd < 1_000 ||
      amountVnd % 1_000 !== 0
    ) {
      return
    }
    depositMutation.mutate()
  }

  const copyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyError('')
      setCopiedField(field)
    } catch {
      setCopyError('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.')
    }
  }

  const refreshPaymentAndWallet = async () => {
    const refreshTasks: Promise<unknown>[] = [
      balanceQuery.refetch(),
      transactionsQuery.refetch(),
    ]

    if (activeOrderId) {
      refreshTasks.push(orderQuery.refetch())
    }

    await Promise.all(refreshTasks)
  }

  const createdOrder = depositMutation.data?.data
  let order: DepositOrderDisplay | undefined

  if (orderQuery.data) {
    let currentCreatedOrder: CreatedPaymentOrder | undefined
    if (createdOrder?.id === orderQuery.data.id) {
      currentCreatedOrder = createdOrder
    }

    order = {
      ...orderQuery.data,
      expectedCoins: orderQuery.data.expectedAmount / 1_000,
      bankName: currentCreatedOrder?.bankName ?? orderQuery.data.bankName,
      bankAccountNumber:
        currentCreatedOrder?.bankAccountNumber ??
        orderQuery.data.bankAccountNumber,
      bankAccountName:
        currentCreatedOrder?.bankAccountName ??
        orderQuery.data.bankAccountName,
      qrUrl: currentCreatedOrder?.qrUrl ?? orderQuery.data.qrUrl,
    }
  } else if (createdOrder) {
    order = {
      ...createdOrder,
      paidAmount: null,
      paidCoins: null,
      isExpired: false,
    }
  }

  const showQr =
    order?.status === 'Pending' &&
    !order.isExpired

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <WalletIcon className="h-6 w-6" />
          Ví coin
        </h1>
        <p className="text-sm text-muted-foreground">
          Nạp coin qua chuyển khoản ngân hàng và xem lịch sử biến động số dư.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            Số dư hiện tại
          </div>
          {balanceQuery.isLoading ? (
            <p className="mt-3 text-3xl font-bold">Đang tải...</p>
          ) : balanceQuery.isError ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-destructive">Không tải được số dư ví.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void balanceQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-3xl font-bold">
              {formatCoins(balanceQuery.data?.balance ?? 0)}{' '}
              <span className="text-base font-medium text-muted-foreground">coin</span>
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            1 coin = 1.000đ. Coin chỉ được cộng sau khi hệ thống xác nhận giao dịch.
          </p>
        </div>

        <form
          onSubmit={handleCreateDeposit}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm"
        >
          <div>
            <h2 className="font-semibold">Tạo yêu cầu nạp coin</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn gói hoặc nhập số tiền là bội số của 1.000đ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEPOSIT_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={amountVnd === preset ? 'default' : 'outline'}
                onClick={() => setAmountInput(String(preset))}
              >
                {formatVnd(preset)}
              </Button>
            ))}
          </div>

          <label className="block space-y-1.5 text-sm font-medium">
            Số tiền muốn nạp (VND)
            <Input
              type="number"
              inputMode="numeric"
              min={1_000}
              step={1_000}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              aria-describedby="deposit-amount-hint"
              required
            />
          </label>
          <p id="deposit-amount-hint" className="text-xs text-muted-foreground">
            Bạn sẽ nhận khoảng {formatCoins(expectedCoins)} coin nếu chuyển khoản
            đủ số tiền trên.
          </p>

          <Button
            type="submit"
            disabled={
              depositMutation.isPending ||
              !Number.isSafeInteger(amountVnd) ||
              amountVnd < 1_000 ||
              amountVnd % 1_000 !== 0
            }
          >
            <ArrowDownToLine className="h-4 w-4" />
            {depositMutation.isPending ? 'Đang tạo đơn...' : 'Tạo mã QR nạp tiền'}
          </Button>

          {depositMutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {getErrorMessage(depositMutation.error, 'Không tạo được đơn nạp.')}
            </p>
          )}
        </form>
      </section>

      {order && (
        <ActiveDepositOrder
          order={order}
          isFetching={orderQuery.isFetching || balanceQuery.isFetching}
          hasStatusError={orderQuery.isError}
          showQr={showQr}
          copiedField={copiedField}
          copyError={copyError}
          onRefresh={() => void refreshPaymentAndWallet()}
          onCopy={(field, value) => void copyValue(field, value)}
        />
      )}

      <WalletTransactionHistory
        transactions={transactionsQuery.data?.items ?? []}
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        isFetching={transactionsQuery.isFetching}
        page={page}
        totalPages={transactionsQuery.data?.totalPages ?? 1}
        onPageChange={setPage}
        onRefresh={() => void transactionsQuery.refetch()}
      />
    </div>
  )
}

export default Wallet
