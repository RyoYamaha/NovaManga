import { useState, type FormEvent, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LockKeyhole,
  Search,
  User,
  Users as UsersIcon,
  Shield,
  Building2,
  Feather,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminService, type AdminUser } from '@/features/admin/api/admin.service'
import { useAuthStore } from '@/stores/auth-store'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import { UsersTable, type UserRoleConfig } from '@/features/admin/components/UsersTable'
import {
  UserEditForm,
  type AdminUserFormValues,
  type EditableUserRole,
} from '@/features/admin/components/UserEditForm'

const emptyForm: AdminUserFormValues = {
  username: '',
  email: '',
  role: 'Reader',
  bio: '',
}

const roleConfigs: Record<AdminUser['role'], UserRoleConfig> = {
  Admin: {
    label: 'Quản trị viên',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: Shield,
  },
  Publisher: {
    label: 'Nhà xuất bản',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Building2,
  },
  Author: {
    label: 'Tác giả',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: Feather,
  },
  Reader: {
    label: 'Độc giả',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: User,
  },
}

export function Users() {
  const queryClient = useQueryClient()
  const { confirm } = useAppDialog()
  const currentUser = useAuthStore((state) => state.user)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<AdminUserFormValues>(emptyForm)
  const [editingUserId, setEditingUserId] = useState<string>()
  const PAGE_SIZE = 20

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
  })

  const users = usersQuery.data ?? []

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchText.trim().toLowerCase()
      const matchSearch =
        !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LOCKED' && u.isLocked) ||
        (statusFilter === 'ACTIVE' && !u.isLocked)

      return matchSearch && matchRole && matchStatus
    })
  }, [users, searchText, roleFilter, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [searchText, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: AdminUserFormValues }) =>
      adminService.updateUser(userId, values),
    onSuccess: async () => {
      setForm(emptyForm)
      setEditingUserId(undefined)
      await refreshUsers()
    },
  })

  const lockUserMutation = useMutation({
    mutationFn: adminService.lockUser,
    onSuccess: refreshUsers,
  })

  const unlockUserMutation = useMutation({
    mutationFn: adminService.unlockUser,
    onSuccess: refreshUsers,
  })

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUserId) return
    const existingUser = users.find((user) => user.id === editingUserId)
    if (existingUser && existingUser.role !== form.role) {
      const confirmed = await confirm({
        title: 'Xác nhận thay đổi vai trò',
        description: `Thay đổi vai trò của "${existingUser.username}" từ ${
          roleConfigs[existingUser.role]?.label || existingUser.role
        } thành ${
          roleConfigs[form.role]?.label || form.role
        }? Quyền truy cập và tính năng của tài khoản sẽ được cập nhật tương ứng.`,
        confirmLabel: 'Thay đổi vai trò',
        tone: 'destructive',
      })
      if (!confirmed) return
    }
    updateUserMutation.mutate({
      userId: editingUserId,
      values: {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        bio: form.bio.trim(),
      },
    })
  }

  const handleLockUser = async (user: AdminUser) => {
    const shouldLock = await confirm({
      title: 'Xác nhận khóa tài khoản',
      description: `Khóa tài khoản "${user.username}"? Người dùng sẽ không thể đăng nhập, tuy nhiên dữ liệu và nội dung đã tạo vẫn được bảo lưu an toàn.`,
      confirmLabel: 'Khóa tài khoản',
      tone: 'destructive',
    })
    if (shouldLock) lockUserMutation.mutate(user.id)
  }

  const handleUnlockUser = async (user: AdminUser) => {
    const shouldUnlock = await confirm({
      title: 'Xác nhận mở khóa tài khoản',
      description: `Mở khóa tài khoản "${user.username}" để người dùng có thể đăng nhập và tiếp tục sử dụng hệ thống?`,
      confirmLabel: 'Mở khóa',
    })
    if (shouldUnlock) unlockUserMutation.mutate(user.id)
  }

  const startEditing = (user: AdminUser) => {
    if (user.role === 'Admin') return
    setEditingUserId(user.id)
    setForm({
      username: user.username,
      email: user.email,
      role: user.role as EditableUserRole,
      bio: user.bio ?? '',
    })
  }

  const cancelForm = () => {
    setEditingUserId(undefined)
    setForm(emptyForm)
  }

  const isSaving = updateUserMutation.isPending

  // Thống kê nhanh
  const readerCount = users.filter((u) => u.role === 'Reader').length
  const authorCount = users.filter((u) => u.role === 'Author').length
  const publisherCount = users.filter((u) => u.role === 'Publisher').length
  const lockedCount = users.filter((u) => u.isLocked).length

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <UsersIcon className="h-4 w-4" />
            <span>Quản trị tài khoản hệ thống</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Xem danh sách tài khoản, cập nhật thông tin vai trò hoặc kiểm soát khóa/mở khóa tài khoản.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshUsers()}
          className="rounded-xl border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#161e29]/90 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Tổng tài khoản</span>
            <UsersIcon className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{users.length}</p>
          <p className="text-[11px] text-slate-400">Đã đăng ký hệ thống</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#161e29]/90 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>Độc giả</span>
            <User className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{readerCount}</p>
          <p className="text-[11px] text-slate-400">Người dùng đọc truyện</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-[#161e29]/90 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
            <span>Tác giả & NXB</span>
            <Feather className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{authorCount + publisherCount}</p>
          <p className="text-[11px] text-slate-400">
            {authorCount} tác giả · {publisherCount} NXB
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-[#161e29]/90 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
            <span>Đang bị khóa</span>
            <LockKeyhole className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{lockedCount}</p>
          <p className="text-[11px] text-slate-400">Tạm dừng truy cập</p>
        </div>
      </div>

      {/* 3. MODAL / KHUNG CHỈNH SỬA NGƯỜI DÙNG */}
      {editingUserId && (
        <UserEditForm
          form={form}
          isSaving={isSaving}
          hasError={updateUserMutation.isError}
          onChange={setForm}
          onSubmit={handleUpdate}
          onCancel={cancelForm}
        />
      )}

      {/* 4. TOOLBAR TÌM KIẾM & BỘ LỌC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo tên đăng nhập, địa chỉ email..."
            className="w-full rounded-2xl border border-white/10 bg-[#161e29] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Vai trò */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Lọc theo vai trò"
            className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="Reader">Độc giả (Reader)</option>
            <option value="Author">Tác giả (Author)</option>
            <option value="Publisher">Nhà xuất bản (Publisher)</option>
            <option value="Admin">Quản trị viên (Admin)</option>
          </select>

          {/* Lọc Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="h-10 rounded-xl border border-white/10 bg-[#161e29] px-3 text-xs font-medium text-slate-300 outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đang bị khóa</option>
          </select>
        </div>
      </div>

      <UsersTable
        users={pagedUsers}
        filteredCount={filteredUsers.length}
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        hasActiveFilters={Boolean(searchText) || roleFilter !== 'ALL' || statusFilter !== 'ALL'}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        currentUserId={currentUser?.id}
        isSaving={isSaving}
        isChangingStatus={lockUserMutation.isPending || unlockUserMutation.isPending}
        roleConfigs={roleConfigs}
        onPageChange={setPage}
        onEdit={startEditing}
        onLock={(user) => void handleLockUser(user)}
        onUnlock={(user) => void handleUnlockUser(user)}
      />

      {(lockUserMutation.isError || unlockUserMutation.isError) && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive text-center">
          Không cập nhật được trạng thái tài khoản. Vui lòng kiểm tra lại kết nối.
        </p>
      )}
    </div>
  )
}

export default Users
