import type { FormEventHandler } from 'react'
import {
  Building,
  Check,
  Copy,
  CreditCard,
  Edit3,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PayoutProfile } from '@/services/finance.service'

type PayoutProfileForm = Omit<PayoutProfile, 'updatedAt'>
type PayoutProfileField = keyof PayoutProfileForm

interface PayoutProfilePanelProps {
  profile?: PayoutProfile | null
  profileForm: PayoutProfileForm
  hasProfile: boolean
  isLoading: boolean
  isError: boolean
  isEditing: boolean
  isSaving: boolean
  copiedAccount: boolean
  errorMessage?: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onCopyAccount: (accountNumber: string) => void
  onProfileChange: (field: PayoutProfileField, value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function PayoutProfilePanel({
  profile,
  profileForm,
  hasProfile,
  isLoading,
  isError,
  isEditing,
  isSaving,
  copiedAccount,
  errorMessage,
  onStartEdit,
  onCancelEdit,
  onCopyAccount,
  onProfileChange,
  onSubmit,
}: PayoutProfilePanelProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-10 text-center text-xs text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="font-semibold">Đang tải thông tin tài khoản ngân hàng...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-xs font-semibold text-rose-400">
        Không tải được hồ sơ ngân hàng. Vui lòng tải lại trang.
      </div>
    )
  }

  if (hasProfile && !isEditing && profile) {
    return (
      <div className="flex flex-col justify-between space-y-5 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <CreditCard className="h-5 w-5 text-primary" /> Tài khoản nhận payout
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tài khoản dùng để nhận chuyển khoản VietQR khi bạn tạo lệnh rút coin.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onStartEdit}
            className="gap-1.5 rounded-xl border-white/10 text-xs font-bold hover:border-primary/50"
          >
            <Edit3 className="h-3.5 w-3.5 text-primary" /> Chỉnh sửa
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#1a2538] via-[#141d2c] to-[#0d1420] p-6 shadow-xl">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-sky-500/10 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col justify-between space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-sky-400" />
                  <span className="text-base font-black uppercase tracking-wide text-white">
                    {profile.bankName}
                  </span>
                </div>
                <span className="inline-block text-[11px] font-semibold text-muted-foreground">
                  Mã BIN: <span className="font-mono text-slate-300">{profile.bankBin}</span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Đã xác thực
              </span>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Số tài khoản thụ hưởng
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black tracking-wider text-white sm:text-2xl">
                  {profile.bankAccountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyAccount(profile.bankAccountNumber)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  title="Sao chép số tài khoản"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-bold text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-primary" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tên chủ tài khoản
                </p>
                <p className="mt-0.5 text-sm font-black uppercase tracking-wide text-white">
                  {profile.bankAccountName}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  VietQR
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          💡 Lưu ý: Khi tạo lệnh rút, thông tin ngân hàng này sẽ được chụp lại để Admin đối soát và
          chuyển khoản thủ công.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Edit3 className="h-4 w-4 text-primary" />
            {hasProfile ? 'Chỉnh sửa tài khoản nhận payout' : 'Thiết lập tài khoản nhận payout'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vui lòng nhập chính xác thông tin ngân hàng để nhận tiền chuyển khoản thủ công từ Admin.
          </p>
        </div>
        {hasProfile && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancelEdit}
            className="gap-1 rounded-xl text-xs text-muted-foreground hover:text-white"
          >
            <X className="h-4 w-4" /> Hủy
          </Button>
        )}
      </div>

      <div className="grid gap-3.5 pt-1 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tên ngân hàng
          </label>
          <Input
            required
            minLength={2}
            maxLength={100}
            placeholder="Ví dụ: TP BANK, Vietcombank, MB..."
            className="h-10 rounded-xl border-white/10 bg-[#0b0f17] text-xs"
            value={profileForm.bankName}
            onChange={(event) => onProfileChange('bankName', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mã BIN ngân hàng
          </label>
          <Input
            required
            maxLength={20}
            placeholder="Ví dụ: 970423 (TPBank)..."
            className="h-10 rounded-xl border-white/10 bg-[#0b0f17] font-mono text-xs"
            value={profileForm.bankBin}
            onChange={(event) => onProfileChange('bankBin', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Số tài khoản ngân hàng
          </label>
          <Input
            required
            maxLength={30}
            placeholder="Nhập số tài khoản ngân hàng..."
            className="h-10 rounded-xl border-white/10 bg-[#0b0f17] font-mono text-xs"
            value={profileForm.bankAccountNumber}
            onChange={(event) => onProfileChange('bankAccountNumber', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tên chủ tài khoản (In hoa không dấu)
          </label>
          <Input
            required
            minLength={2}
            maxLength={100}
            placeholder="Ví dụ: NGUYEN VAN A"
            className="h-10 rounded-xl border-white/10 bg-[#0b0f17] text-xs font-semibold uppercase"
            value={profileForm.bankAccountName}
            onChange={(event) => onProfileChange('bankAccountName', event.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 pt-2">
        <Button type="submit" disabled={isSaving} className="gap-2 rounded-xl px-6 font-bold">
          <Save className="h-4 w-4" />
          {isSaving ? 'Đang lưu...' : 'Lưu tài khoản ngân hàng'}
        </Button>
        {hasProfile && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            className="rounded-xl border-white/10"
          >
            Hủy bỏ
          </Button>
        )}
      </div>

      {errorMessage && (
        <p
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </form>
  )
}
