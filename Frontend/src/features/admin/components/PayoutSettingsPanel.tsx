import type { FormEventHandler } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PayoutSettingsPanelProps {
  minimumInput: string
  minimumValue?: number
  isMinimumPending: boolean
  isMinimumLoadError: boolean
  minimumSaveErrorMessage?: string
  onMinimumInputChange: (value: string) => void
  onSubmitMinimum: FormEventHandler<HTMLFormElement>
}

export function PayoutSettingsPanel({
  minimumInput,
  minimumValue,
  isMinimumPending,
  isMinimumLoadError,
  minimumSaveErrorMessage,
  onMinimumInputChange,
  onSubmitMinimum,
}: PayoutSettingsPanelProps) {
  return (
    <section className="space-y-4">
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
    </section>
  )
}
