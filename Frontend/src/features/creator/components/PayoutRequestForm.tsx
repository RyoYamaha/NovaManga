import type { FormEventHandler } from 'react'
import { AlertCircle, ArrowUpRight, Banknote, CreditCard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PayoutProfile } from '@/services/finance.service'

interface PayoutRequestFormProps {
  profile?: PayoutProfile | null
  isProfileLoading: boolean
  minimumCoins: number
  availableCoins: number
  amountInput: string
  parsedAmount: number
  hasProfile: boolean
  isAmountValid: boolean
  isPending: boolean
  errorMessage?: string
  formatCoins: (value: number) => string
  onAmountChange: (value: string) => void
  onSelectAmount: (value: number) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function PayoutRequestForm({
  profile,
  isProfileLoading,
  minimumCoins,
  availableCoins,
  amountInput,
  parsedAmount,
  hasProfile,
  isAmountValid,
  isPending,
  errorMessage,
  formatCoins,
  onAmountChange,
  onSelectAmount,
  onSubmit,
}: PayoutRequestFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col justify-between space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Banknote className="h-5 w-5 text-emerald-400" /> Tạo yêu cầu rút coin
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Mức rút tối thiểu:{' '}
              <span className="font-bold text-white">{formatCoins(minimumCoins)} coin</span>. Admin
              sẽ chuyển khoản qua VietQR.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Chọn nhanh số lượng rút:
          </label>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectAmount(preset)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                  parsedAmount === preset
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-white/10 bg-[#0b0f17] text-muted-foreground hover:border-white/20 hover:text-white',
                )}
              >
                {preset} coin
              </button>
            ))}
            {availableCoins >= minimumCoins && (
              <button
                type="button"
                onClick={() => onSelectAmount(availableCoins)}
                className={cn(
                  'flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                  parsedAmount === availableCoins
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                )}
              >
                <Sparkles className="h-3 w-3" /> Tối đa ({formatCoins(availableCoins)})
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hoặc nhập số coin muốn rút:
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={minimumCoins}
            max={availableCoins}
            step={1}
            placeholder={`Nhập số coin (tối thiểu ${formatCoins(minimumCoins)})...`}
            className="h-11 rounded-xl border-white/10 bg-[#0b0f17] text-sm font-black"
            value={amountInput}
            onChange={(event) => onAmountChange(event.target.value)}
            required
          />
        </div>

        {amountInput !== '' && (
          <div className="animate-in fade-in space-y-1.5 rounded-xl border border-white/10 bg-[#0b0f17] p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Số tiền quy đổi ước tính:</span>
              <span className="font-bold text-emerald-400">
                ≈ {formatCoins(parsedAmount * 1000)} VNĐ
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
              <span className="text-muted-foreground">Số dư khả dụng còn lại:</span>
              <span
                className={cn(
                  'font-bold',
                  parsedAmount > availableCoins ? 'text-rose-400' : 'text-slate-300',
                )}
              >
                {formatCoins(Math.max(0, availableCoins - parsedAmount))} coin
              </span>
            </div>
          </div>
        )}

        {profile ? (
          <div className="space-y-1 rounded-xl border border-white/10 bg-[#0b0f17] p-3.5 text-xs">
            <p className="flex items-center gap-2 font-bold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Người nhận:{' '}
              <span className="font-black uppercase text-white">{profile.bankAccountName}</span>
            </p>
            <p className="pl-6 font-mono text-[11px] text-muted-foreground">
              {profile.bankName} · STK:{' '}
              <span className="font-bold text-white">{profile.bankAccountNumber}</span>
            </p>
          </div>
        ) : !isProfileLoading ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold">Chưa có tài khoản nhận tiền</p>
              <p className="mt-0.5 text-[11px] text-amber-300/80">
                Vui lòng thiết lập thông tin ngân hàng ở khung bên cạnh trước khi gửi yêu cầu rút.
              </p>
            </div>
          </div>
        ) : null}

        {parsedAmount > availableCoins && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-400">
            ⚠️ Số coin muốn rút vượt quá số dư khả dụng hiện có ({formatCoins(availableCoins)} coin).
          </p>
        )}
        {amountInput !== '' && parsedAmount < minimumCoins && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs font-semibold text-amber-300">
            ⚠️ Mức rút tối thiểu là {minimumCoins} coin.
          </p>
        )}
      </div>

      <div>
        <Button
          type="submit"
          className="mt-2 w-full gap-2 rounded-xl py-3 font-bold"
          disabled={isPending || !hasProfile || !isAmountValid}
        >
          <ArrowUpRight className="h-4 w-4" />
          {isPending ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút coin ngay'}
        </Button>

        {errorMessage && (
          <p
            className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  )
}
