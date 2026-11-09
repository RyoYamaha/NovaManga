import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export interface SidebarItem {
  label: string
  to: string
  icon?: ComponentType<{ className?: string }>
  end?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  title?: string
}

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-[#1a2533] md:w-52 md:border-b-0 md:border-r">
      <nav
        className="flex gap-1 overflow-x-auto p-2 md:sticky md:top-12 md:flex-col md:h-[calc(100vh-3rem)] md:overflow-y-auto md:p-3"
        aria-label={title ?? 'Điều hướng'}
      >
        {title && (
          <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
            {title}
          </p>
        )}
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors md:w-full',
                isActive
                  ? 'bg-[#344357] text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
