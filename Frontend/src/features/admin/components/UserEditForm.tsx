import type { FormEventHandler } from 'react'
import { Loader2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type EditableUserRole = 'Reader' | 'Author' | 'Publisher'

export interface AdminUserFormValues {
  username: string
  email: string
  role: EditableUserRole
  bio: string
}

interface UserEditFormProps {
  form: AdminUserFormValues
  isSaving: boolean
  hasError: boolean
  onChange: (form: AdminUserFormValues) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

export function UserEditForm({
  form,
  isSaving,
  hasError,
  onChange,
  onSubmit,
  onCancel,
}: UserEditFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-5 overflow-hidden rounded-3xl border border-primary/30 bg-[#161e29] p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Pencil className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chỉnh sửa thông tin tài khoản</h2>
            <p className="text-xs text-slate-400">
              Cập nhật vai trò và thông tin cá nhân của người dùng
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-semibold text-slate-300">
          <span>Tên đăng nhập</span>
          <Input
            required
            minLength={3}
            maxLength={30}
            value={form.username}
            onChange={(event) => onChange({ ...form, username: event.target.value })}
            className="rounded-xl border-white/10 bg-[#121820] text-sm"
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-slate-300">
          <span>Địa chỉ Email</span>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            className="rounded-xl border-white/10 bg-[#121820] text-sm"
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-slate-300">
          <span>Vai trò tài khoản</span>
          <select
            value={form.role}
            onChange={(event) =>
              onChange({ ...form, role: event.target.value as EditableUserRole })
            }
            className="h-10 w-full rounded-xl border border-white/10 bg-[#121820] px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="Reader">Người đọc (Reader)</option>
            <option value="Author">Tác giả (Author)</option>
            <option value="Publisher">Nhà xuất bản (Publisher)</option>
          </select>
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-slate-300 sm:col-span-2">
          <span>Giới thiệu tiểu sử (Bio)</span>
          <textarea
            maxLength={1000}
            rows={3}
            value={form.bio}
            onChange={(event) => onChange({ ...form, bio: event.target.value })}
            placeholder="Giới thiệu ngắn về người dùng..."
            className="w-full rounded-xl border border-white/10 bg-[#121820] p-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>

      {hasError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          Không thể lưu thông tin người dùng. Vui lòng kiểm tra email hoặc tên đăng nhập có bị trùng lặp không.
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 border-t border-white/10 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl border-white/10 text-xs"
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary font-bold text-slate-950 hover:brightness-110"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
