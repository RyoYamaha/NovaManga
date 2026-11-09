import type { FormEventHandler } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PayoutSettingsPanelProps {
  minimumInput: string
  minimumValue?: number
  blockUserId: string
  shouldBlockUser: boolean
  isMinimumPending: boolean
  isMinimumLoadError: boolean
  minimumSaveErrorMessage?: string
  isBlockPending: boolean
  blockErrorMessage?: string
  onMinimumInputChange: (value: string) => void
  onBlockUserIdChange: (value: string) => void
  onBlockActionChange: (shouldBlock: boolean) => void
  onSubmitMinimum: FormEventHandler<HTMLFormElement>
  onSubmitBlock: FormEventHandler<HTMLFormElement>
}

export function PayoutSettingsPanel({
  minimumInput,
  minimumValue,
  blockUserId,
  shouldBlockUser,
  isMinimumPending,
  isMinimumLoadError,
  minimumSaveErrorMessage,
  isBlockPending,
  blockErrorMessage,
  onMinimumInputChange,
  onBlockUserIdChange,
  onBlockActionChange,
  onSubmitMinimum,
  onSubmitBlock,
}: PayoutSettingsPanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <form
        onSubmit={onSubmitMinimum}
        className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold">Mức rút tối thiểu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình được lưu trong SystemSetting. Giá trị nhỏ nhất là 10 coin.
          </p>
        </div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <Input
            type="number"
            min={10}
            step={1}
            value={minimumInput || (minimumValue !== undefined ? String(minimumValue) : '')}
            onChange={(event) => onMinimumInputChange(event.target.value)}
            aria-label="Mức payout tối thiểu"
            className="min-w-0 flex-1"
            required
          />
          <Button type="submit" className="shrink-0" disabled={isMinimumPending}>
            {isMinimumPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
        {isMinimumLoadError && (
          <p className="text-sm text-destructive">Không tải được mức payout hiện tại.</p>
        )}
        {minimumSaveErrorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {minimumSaveErrorMessage}
          </p>
        )}
      </form>

      <form
        onSubmit={onSubmitBlock}
        className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm"
      >
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Chặn hoặc gỡ chặn payout theo user ID
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dùng khi cần tạm giữ thanh toán do tranh chấp hoặc gỡ chặn sau khi rà soát.
          </p>
        </div>
        <div className="flex max-w-lg flex-col gap-2 sm:flex-row">
          <Input
            value={blockUserId}
            onChange={(event) => onBlockUserIdChange(event.target.value)}
            placeholder="User ID"
            aria-label="User ID cần chặn payout"
            className="min-w-0 flex-1"
            required
          />
          <select
            className="h-9.5 rounded-xl border border-white/10 bg-[#0b0f17] px-3 text-xs text-foreground focus:border-primary focus:outline-none sm:w-auto"
            value={shouldBlockUser ? 'block' : 'unblock'}
            onChange={(event) => onBlockActionChange(event.target.value === 'block')}
            aria-label="Thao tác chặn payout"
          >
            <option value="block">Chặn</option>
            <option value="unblock">Gỡ chặn</option>
          </select>
          <Button
            type="submit"
            className="shrink-0"
            variant={shouldBlockUser ? 'destructive' : 'default'}
            disabled={isBlockPending}
          >
            {isBlockPending
              ? 'Đang cập nhật...'
              : shouldBlockUser
                ? 'Chặn payout'
                : 'Gỡ chặn'}
          </Button>
        </div>
        {blockErrorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {blockErrorMessage}
          </p>
        )}
      </form>
    </section>
  )
}
