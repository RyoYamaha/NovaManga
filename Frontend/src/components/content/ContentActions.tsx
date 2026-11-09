import { Bookmark, Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useCollection, type CollectionKind } from '@/features/library/hooks/useCollection'

// ==========================================
// 1. COMPONENT NÚT BẤM DÙNG CHUNG (TOGGLE BUTTON)
// ==========================================
function ToggleButton({
  kind,
  contentId,
  label,
  Icon,
  activeColorClass,
}: {
  kind: CollectionKind
  contentId: string
  label: string
  Icon: typeof Heart
  activeColorClass: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { has, add, remove, isLoading } = useCollection(kind)

  const active = has(contentId)
  const busy = add.isPending || remove.isPending || (!!user && isLoading)

  const onClick = () => {
    if (!user) return navigate('/login', { state: { from: location } })
    if (active) remove.mutate(contentId)
    else add.mutate(contentId)
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? activeColorClass
          : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon
        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
          active ? 'fill-current' : 'text-slate-300 group-hover:text-white'
        }`}
      />
      <span>{label}</span>
    </button>
  )
}

// ==========================================
// 2. VÙNG CHỨA CÁC NÚT (ACTIONS CONTAINER)
// ==========================================
export function ContentActions({ contentId }: { contentId: string }) {
  const user = useAuthStore((s) => s.user)

  if (user && user.role !== 'Reader') {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleButton
        kind="bookmarks"
        contentId={contentId}
        label="Đánh dấu"
        Icon={Bookmark}
        activeColorClass="border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(242,184,75,0.25)]"
      />
      <ToggleButton
        kind="favorites"
        contentId={contentId}
        label="Yêu thích"
        Icon={Heart}
        activeColorClass="border-rose-400/50 bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
      />
    </div>
  )
}

export default ContentActions
