import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Sidebar, type SidebarItem } from './Sidebar'
import { AiFloatingAssistant } from '@/features/ai/components/AiFloatingAssistant'

interface Props {
  items: SidebarItem[]
  title?: string
}

export function SidebarLayout({ items, title }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar items={items} title={title} />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </div>
      <AiFloatingAssistant />
    </div>
  )
}

export default SidebarLayout
