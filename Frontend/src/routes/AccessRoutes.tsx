import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

export function SupportAccessRoute() {
  const role = useAuthStore((state) => state.user?.role)

  if (role === 'Publisher') return <Navigate to="/" replace />
  return <Outlet />
}

export function ReaderAccessRoute() {
  const role = useAuthStore((state) => state.user?.role)

  if (role !== 'Reader') return <Navigate to="/" replace />
  return <Outlet />
}
