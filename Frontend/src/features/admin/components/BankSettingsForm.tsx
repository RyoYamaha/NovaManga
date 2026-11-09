import type { FormEventHandler } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { BankSettings } from '@/services/finance.service'

export interface BankSettingsFormValues {
  bankName: string
  bankBin: string
  bankAccountNumber: string
  bankAccountName: string
}

interface BankSettingsFormProps {
  settings?: BankSettings
  isLoading: boolean
  isError: boolean
  form: BankSettingsFormValues
  isSaving: boolean
  errorMessage?: string
  onFieldChange: (field: keyof BankSettingsFormValues, value: string) => void
  onRetry: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function BankSettingsForm({
  settings,
  isLoading,
  isError,
  form,
  isSaving,
  errorMessage,
  onFieldChange,
  onRetry,
  onSubmit,
}: BankSettingsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Settings2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">Tài khoản nhận tiền nạp</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thông tin này được lưu vào đơn mới và dùng để tạo VietQR.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">Không tải được cấu hình ngân hàng.</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 text-sm font-medium">
              Tên ngân hàng
              <Input required maxLength={100} value={form.bankName} onChange={(event) => onFieldChange('bankName', event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Bank BIN
              <Input required pattern="[A-Za-z0-9]{3,20}" maxLength={20} value={form.bankBin} onChange={(event) => onFieldChange('bankBin', event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Số tài khoản
              <Input required pattern="[0-9]{6,30}" maxLength={30} value={form.bankAccountNumber} onChange={(event) => onFieldChange('bankAccountNumber', event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Tên chủ tài khoản
              <Input required maxLength={100} value={form.bankAccountName} onChange={(event) => onFieldChange('bankAccountName', event.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {settings?.configured
                ? 'Đã cấu hình tài khoản nhận.'
                : 'Chưa cấu hình; người dùng chưa thể tạo đơn nạp.'}
            </span>
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
          )}
        </>
      )}
    </form>
  )
}
