import {
  Calendar,
  CheckCircle2,
  LockKeyhole,
  Loader2,
  Pencil,
  Unlock,
  User,
  Users as UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import type { AdminUser } from '@/features/admin/api/admin.service'

export interface UserRoleConfig {
  label: string
  bg: string
  text: string
  border: string
  icon: LucideIcon
}

interface UsersTableProps {
  users: AdminUser[]
  filteredCount: number
  isLoading: boolean
  isError: boolean
  hasActiveFilters: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  currentUserId?: string
  isSaving: boolean
  isChangingStatus: boolean
  roleConfigs: Record<AdminUser['role'], UserRoleConfig>
  onPageChange: (page: number) => void
  onEdit: (user: AdminUser) => void
  onLock: (user: AdminUser) => void
  onUnlock: (user: AdminUser) => void
}

export function UsersTable({
  users,
  filteredCount,
  isLoading,
  isError,
  hasActiveFilters,
  currentPage,
  totalPages,
  pageSize,
  currentUserId,
  isSaving,
  isChangingStatus,
  roleConfigs,
  onPageChange,
  onEdit,
  onLock,
  onUnlock,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#161e29]/60 p-12 text-center text-sm text-slate-400 backdrop-blur-xl">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
        Đang tải danh sách người dùng...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
        Không tải được danh sách người dùng. Vui lòng thử lại.
      </div>
    )
  }

  if (filteredCount === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#161e29]/40 p-12 text-center text-slate-400 backdrop-blur-xl">
        <UsersIcon className="mx-auto h-10 w-10 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-300">Không tìm thấy người dùng phù hợp</p>
        <p className="text-xs text-slate-500 mt-1">
          {hasActiveFilters
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
            : 'Hiện chưa có tài khoản người dùng nào'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161e29]/90 shadow-xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="p-4">Người dùng</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Ngày đăng ký</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const roleConfig = roleConfigs[user.role] ?? {
                label: user.role,
                bg: 'bg-white/5',
                text: 'text-slate-300',
                border: 'border-white/10',
                icon: User,
              }
              const RoleIcon = roleConfig.icon
              const isAdminAccount = user.role === 'Admin'
              const isCurrentAdmin = user.id === currentUserId

              return (
                <tr key={user.id} className="group transition-colors hover:bg-white/[0.03]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-primary/10 font-bold text-primary shadow-inner text-xs sm:text-sm">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white group-hover:text-primary transition-colors">
                          {user.username}
                          {isCurrentAdmin && (
                            <span className="ml-2 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border}`}>
                      <RoleIcon className="h-3.5 w-3.5" />
                      <span>{roleConfig.label}</span>
                    </span>
                  </td>

                  <td className="p-4">
                    {user.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                        <LockKeyhole className="h-3 w-3" /> Đang bị khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Hoạt động
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {!isAdminAccount && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(user)}
                            disabled={isSaving}
                            className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-200 hover:text-white hover:bg-white/10"
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Sửa
                          </Button>

                          {user.isLocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isChangingStatus}
                              onClick={() => onUnlock(user)}
                              className="rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium"
                            >
                              <Unlock className="mr-1.5 h-3.5 w-3.5" /> Mở khóa
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentAdmin || isChangingStatus}
                              title={isCurrentAdmin ? 'Không thể khóa tài khoản đang đăng nhập' : 'Khóa tài khoản'}
                              onClick={() => onLock(user)}
                              className="rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium"
                            >
                              <LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Khóa
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
        <span>
          Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCount)} / {filteredCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Trước
          </Button>
          <PageJumpInput currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  )
}
