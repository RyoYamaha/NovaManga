import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, X, Wallet, CheckCircle2 } from 'lucide-react'
import { Navigate } from 'react-router'
import { EarningsSummaryCards } from '@/features/creator/components/EarningsSummaryCards'
import { EarningsActivitySection } from '@/features/creator/components/EarningsActivitySection'
import { PayoutProfilePanel } from '@/features/creator/components/PayoutProfilePanel'
import { PayoutRequestForm } from '@/features/creator/components/PayoutRequestForm'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import {
  financeService,
  type PayoutProfile,
} from '@/services/finance.service'

function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
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

export function Earnings() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()

  const [profileForm, setProfileForm] = useState<Omit<PayoutProfile, 'updatedAt'>>({
    bankName: '',
    bankBin: '',
    bankAccountNumber: '',
    bankAccountName: '',
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const copyAccountNumber = (accNum: string) => {
    navigator.clipboard.writeText(accNum)
    setCopiedAccount(true)
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  const summaryQuery = useQuery({
    queryKey: ['revenue', 'summary'],
    enabled: user?.role === 'Author' || user?.role === 'Publisher',
    queryFn: async () => (await financeService.getRevenueSummary()).data,
  })

  const historyQuery = useQuery({
    queryKey: ['revenue', 'history', 1],
    enabled: user?.role === 'Author' || user?.role === 'Publisher',
    queryFn: async () => (await financeService.getRevenueHistory(1, 50)).data,
  })

  const minimumQuery = useQuery({
    queryKey: ['payout', 'minimum'],
    enabled: user?.role === 'Author' || user?.role === 'Publisher',
    queryFn: async () => (await financeService.getPayoutMinimum()).data,
  })

  const profileQuery = useQuery({
    queryKey: ['payout', 'profile'],
    enabled: user?.role === 'Author' || user?.role === 'Publisher',
    queryFn: async () => (await financeService.getPayoutProfile()).data,
  })

  const requestsQuery = useQuery({
    queryKey: ['payout', 'my-requests'],
    enabled: user?.role === 'Author' || user?.role === 'Publisher',
    queryFn: async () => (await financeService.getMyPayoutRequests()).data,
  })

  const profile = profileQuery.data?.profile
  const hasProfile = profileQuery.data?.configured ?? false
  const minimumCoins = minimumQuery.data ?? 10
  const availableCoins = summaryQuery.data?.availableCoins ?? 0

  const handleStartEdit = () => {
    if (profile) {
      setProfileForm({
        bankName: profile.bankName,
        bankBin: profile.bankBin,
        bankAccountNumber: profile.bankAccountNumber,
        bankAccountName: profile.bankAccountName,
      })
    }
    setIsEditingProfile(true)
  }

  const handleQuickSelectAmount = (amount: number) => {
    setAmountInput(amount.toString())
  }

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Omit<PayoutProfile, 'updatedAt'>) =>
      financeService.updatePayoutProfile(profileData),
    onSuccess: async () => {
      setSuccessMessage('Đã cập nhật thông tin tài khoản ngân hàng nhận payout thành công.')
      setIsEditingProfile(false)
      await queryClient.invalidateQueries({ queryKey: ['payout', 'profile'] })
    },
  })

  const payoutMutation = useMutation({
    mutationFn: (amountCoins: number) =>
      financeService.createPayoutRequest(amountCoins),
    onSuccess: async () => {
      setAmountInput('')
      setSuccessMessage('Đã gửi yêu cầu rút coin thành công. Admin sẽ tiến hành chuyển khoản thủ công theo lịch.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['revenue', 'summary'] }),
        queryClient.invalidateQueries({ queryKey: ['payout', 'my-requests'] }),
      ])
    },
  })

  const onProfileChange = (
    field: keyof Omit<PayoutProfile, 'updatedAt'>,
    value: string,
  ) => {
    setSuccessMessage('')
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentProfile = profileQuery.data?.profile
    if (
      !currentProfile ||
      currentProfile.bankName !== profileForm.bankName ||
      currentProfile.bankBin !== profileForm.bankBin ||
      currentProfile.bankAccountNumber !== profileForm.bankAccountNumber ||
      currentProfile.bankAccountName !== profileForm.bankAccountName
    ) {
      const confirmed = await confirm({
        title: 'Xác nhận thay đổi tài khoản nhận payout',
        description: currentProfile
          ? 'Cập nhật thông tin ngân hàng sẽ nhận các khoản payout trong tương lai?'
          : 'Lưu tài khoản ngân hàng này làm nơi nhận payout?',
        confirmLabel: 'Cập nhật tài khoản',
      })
      if (!confirmed) return
    }
    setSuccessMessage('')
    updateProfileMutation.mutate(profileForm)
  }

  const submitPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(amountInput)
    if (!Number.isSafeInteger(amount) || amount < minimumCoins) {
      return
    }
    const confirmed = await confirm({
      title: 'Xác nhận yêu cầu rút coin',
      description: `Gửi yêu cầu rút ${formatCoins(amount)} coin (tương đương ${formatCoins(amount * 1000)} VNĐ) về tài khoản ngân hàng ${profile?.bankName} - ${profile?.bankAccountNumber}? Số coin sẽ được bảo lưu trong thời gian xét duyệt.`,
      confirmLabel: 'Gửi yêu cầu rút ngay',
    })
    if (!confirmed) return
    setSuccessMessage('')
    payoutMutation.mutate(amount)
  }

  const parsedAmount = Number(amountInput) || 0
  const isAmountValid = parsedAmount >= minimumCoins && parsedAmount <= availableCoins && Number.isSafeInteger(parsedAmount)

  if (user?.role !== 'Author' && user?.role !== 'Publisher') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 p-4 md:p-6 pb-20">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Wallet className="h-7 w-7 text-primary" /> Doanh thu & Rút coin
            </h1>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
              {user.role === 'Publisher' ? 'Nhà Xuất Bản' : 'Tác Giả Sáng Tác'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Xem báo cáo doanh số từ lượt đọc trả phí, quản lý tài khoản thụ hưởng và gửi yêu cầu rút coin nhanh chóng.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void summaryQuery.refetch()
            void historyQuery.refetch()
            void requestsQuery.refetch()
          }}
          disabled={summaryQuery.isFetching}
          className="rounded-xl border-white/10 hover:border-white/20 gap-2 font-bold text-xs shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${summaryQuery.isFetching ? 'animate-spin' : ''}`} />
          Làm mới số liệu
        </Button>
      </div>

      {/* SUCCESS NOTIFICATION BANNER */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in" role="status">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <EarningsSummaryCards
        summary={summaryQuery.data}
        availableCoins={availableCoins}
        minimumCoins={minimumCoins}
        payoutCount={requestsQuery.data?.items.length ?? 0}
        formatCoins={formatCoins}
        onSelectMax={() => handleQuickSelectAmount(availableCoins)}
      />

      {/* 3. MAIN WORKSPACE: PAYOUT ACCOUNT & WITHDRAWAL FORM */}
      <section className="grid gap-6 lg:grid-cols-2">
        <PayoutProfilePanel
          profile={profile}
          profileForm={profileForm}
          hasProfile={hasProfile}
          isLoading={profileQuery.isLoading}
          isError={profileQuery.isError}
          isEditing={isEditingProfile}
          isSaving={updateProfileMutation.isPending}
          copiedAccount={copiedAccount}
          errorMessage={
            updateProfileMutation.isError
              ? getErrorMessage(updateProfileMutation.error, 'Không lưu được hồ sơ ngân hàng.')
              : undefined
          }
          onStartEdit={handleStartEdit}
          onCancelEdit={() => setIsEditingProfile(false)}
          onCopyAccount={copyAccountNumber}
          onProfileChange={onProfileChange}
          onSubmit={submitProfile}
        />

        <PayoutRequestForm
          profile={profile}
          isProfileLoading={profileQuery.isLoading}
          minimumCoins={minimumCoins}
          availableCoins={availableCoins}
          amountInput={amountInput}
          parsedAmount={parsedAmount}
          hasProfile={hasProfile}
          isAmountValid={isAmountValid}
          isPending={payoutMutation.isPending}
          errorMessage={
            payoutMutation.isError
              ? getErrorMessage(payoutMutation.error, 'Không gửi được yêu cầu rút.')
              : undefined
          }
          formatCoins={formatCoins}
          onAmountChange={setAmountInput}
          onSelectAmount={handleQuickSelectAmount}
          onSubmit={submitPayout}
        />
      </section>

      <EarningsActivitySection
        historyItems={historyQuery.data?.items}
        historyLoading={historyQuery.isLoading}
        historyError={historyQuery.isError}
        payoutRequests={requestsQuery.data?.items}
        payoutsLoading={requestsQuery.isLoading}
        payoutsError={requestsQuery.isError}
      />
    </div>
  )
}

export default Earnings
