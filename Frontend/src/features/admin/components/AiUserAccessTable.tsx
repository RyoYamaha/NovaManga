import { PageJumpInput } from '@/components/common/PageJumpInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AiManagedUser } from '@/features/ai/types/ai'
import { ShieldBan, ShieldCheck } from 'lucide-react'

interface AiUserAccessTableProps {
  users: AiManagedUser[]
  pageUsers: AiManagedUser[]
  search: string
  isLoading: boolean
  isError: boolean
  isPending: boolean
  currentPage: number
  totalPages: number
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onToggleUser: (user: AiManagedUser) => void
}

export function AiUserAccessTable({
  users,
  pageUsers,
  search,
  isLoading,
  isError,
  isPending,
  currentPage,
  totalPages,
  onSearchChange,
  onPageChange,
  onToggleUser,
}: AiUserAccessTableProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#121924]/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Quản lý quyền AI theo người dùng</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Khóa quyền dùng AI đối với các tài khoản spam hoặc lạm dụng. Không ảnh hưởng đến quyền đọc truyện.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-1">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo username hoặc email..."
            className="h-9 rounded-xl border-white/10 bg-[#0c121b] text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Đang tải danh sách người dùng...
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Người dùng</th>
                <th className="py-3 pr-4">Vai trò</th>
                <th className="py-3 pr-4">Trạng thái AI</th>
                <th className="py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageUsers.map((user) => {
                const isBlocked = user.aiBlocked
                return (
                  <tr key={user.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="py-3.5 pr-4">
                      <span className="block font-semibold text-white">{user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                          <ShieldBan className="h-3 w-3" /> Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> Được phép
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant={isBlocked ? 'outline' : 'destructive'}
                        disabled={isPending}
                        onClick={() => onToggleUser(user)}
                        className="rounded-xl text-xs"
                      >
                        {isBlocked ? (
                          <>
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Mở khóa AI
                          </>
                        ) : (
                          <>
                            <ShieldBan className="mr-1.5 h-3.5 w-3.5" /> Khóa quyền AI
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {!users.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Trang trước
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PageJumpInput
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
            <span className="text-xs text-muted-foreground">· {users.length} người dùng</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}
    </section>
  )
}
