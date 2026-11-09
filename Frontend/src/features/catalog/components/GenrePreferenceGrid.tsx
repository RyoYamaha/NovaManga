import {
  Check,
  BookOpen,
  Coffee,
  Compass,
  Flame,
  Ghost,
  Heart,
  Rocket,
  Scroll,
  Search,
  Smile,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react'
import type { Genre } from '@/types/content'

interface GenreMeta {
  icon: typeof Sparkles
  description: string
  gradient: string
  accentColor: string
}

const GENRE_METADATA: Record<string, GenreMeta> = {
  Action: {
    icon: Zap,
    description: 'Hành động kịch tính, chiến đấu nảy lửa',
    gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    accentColor: 'text-orange-400',
  },
  Fantasy: {
    icon: Wand2,
    description: 'Thế giới phép thuật, sinh vật huyền bí',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    accentColor: 'text-purple-400',
  },
  Historical: {
    icon: Scroll,
    description: 'Bối cảnh lịch sử, cổ trang hào hùng',
    gradient: 'from-amber-700/20 via-yellow-900/10 to-transparent',
    accentColor: 'text-amber-400',
  },
  Horror: {
    icon: Ghost,
    description: 'Rùng rợn, giật gân, thế lực siêu nhiên',
    gradient: 'from-red-950/40 via-slate-900 to-transparent',
    accentColor: 'text-rose-400',
  },
  Isekai: {
    icon: Compass,
    description: 'Chuyển sinh, xuyên không đến dị giới',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    accentColor: 'text-cyan-400',
  },
  Mystery: {
    icon: Search,
    description: 'Phá án trinh thám, giải mã bí ẩn',
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    accentColor: 'text-teal-400',
  },
  Romance: {
    icon: Heart,
    description: 'Tình cảm đôi lứa, ngọt ngào sâu sắc',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    accentColor: 'text-rose-400',
  },
  Thriller: {
    icon: Flame,
    description: 'Căng thẳng hồi hộp, tâm lý kịch tính',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    accentColor: 'text-amber-400',
  },
  Comedy: {
    icon: Smile,
    description: 'Hài hước hóm hỉnh, tiếng cười sảng khoái',
    gradient: 'from-yellow-500/20 via-lime-500/10 to-transparent',
    accentColor: 'text-yellow-400',
  },
  Adventure: {
    icon: Compass,
    description: 'Hành trình thám hiểm vùng đất mới',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accentColor: 'text-emerald-400',
  },
  'Sci-Fi': {
    icon: Rocket,
    description: 'Khoa học công nghệ, vũ trụ tương lai',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    accentColor: 'text-blue-400',
  },
  'Slice of Life': {
    icon: Coffee,
    description: 'Đời thường nhẹ nhàng, câu chuyện chữa lành',
    gradient: 'from-amber-600/20 via-orange-500/10 to-transparent',
    accentColor: 'text-orange-300',
  },
}

const getGenreMeta = (name: string): GenreMeta =>
  GENRE_METADATA[name] ?? {
    icon: BookOpen,
    description: 'Những câu chuyện và góc nhìn đặc sắc',
    gradient: 'from-primary/20 via-amber-500/10 to-transparent',
    accentColor: 'text-primary',
  }

interface GenrePreferenceGridProps {
  genres: Genre[]
  selectedIds: string[]
  count: number
  onToggleGenre: (genreId: string) => void
}

export function GenrePreferenceGrid({
  genres,
  selectedIds,
  count,
  onToggleGenre,
}: GenrePreferenceGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {genres.map((genre) => {
        const selected = selectedIds.includes(genre.id)
        const meta = getGenreMeta(genre.name)
        const Icon = meta.icon
        const isMaxReached = count >= 5 && !selected

        return (
          <button
            key={genre.id}
            type="button"
            aria-pressed={selected}
            disabled={isMaxReached}
            onClick={() => onToggleGenre(genre.id)}
            className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${
              selected
                ? 'border-primary bg-[#2b3d55] ring-1 ring-primary/50'
                : isMaxReached
                  ? 'cursor-not-allowed border-white/5 bg-[#141a23] opacity-40'
                  : 'border-white/10 bg-[#202d3d] hover:border-white/25 hover:bg-[#263547]'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                selected
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-slate-300 group-hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <h3
                className={`text-sm font-bold transition-colors ${
                  selected ? 'text-primary' : 'text-white group-hover:text-sky-200'
                }`}
              >
                {genre.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {meta.description}
              </p>
            </div>

            <div className="absolute right-3.5 top-3.5">
              {selected ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5 transition-colors group-hover:border-white/40" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
