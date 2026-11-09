import { useState } from 'react'
import { Star, Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ratingService } from '@/services/rating.service'
import { useAuthStore } from '@/stores/auth-store'
import type { MyRating } from '@/features/library/types/library'

// ==========================================
// COMPONENT CHẤM ĐIỂM BẰNG NGÔI SAO
// ==========================================
export function RatingStars({ contentId }: { contentId: string }) {
  const isAuth = useAuthStore((s) => !!s.user)
  const qc = useQueryClient()

  // State nội bộ lưu tạm số sao khi người dùng rê chuột (hover)
  const [hover, setHover] = useState(0)

  // 1.1 Lấy tổng quan (Điểm trung bình và Tổng lượt đánh giá)
  const summary = useQuery({
    queryKey: ['rating-summary', contentId],
    enabled: isAuth,
    queryFn: async () => (await ratingService.getSummary(contentId)).data,
  })

  // 1.2 Lấy điểm đánh giá của chính người dùng hiện tại
  const mine = useQuery({
    queryKey: ['rating-mine', contentId],
    enabled: isAuth,
    retry: false,
    queryFn: async (): Promise<MyRating | null> => {
      try {
        return (await ratingService.getMine(contentId)).data ?? null
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 404) return null
        throw e
      }
    },
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['rating-summary', contentId] })
    qc.invalidateQueries({ queryKey: ['rating-mine', contentId] })
  }

  // Gửi điểm mới lên Backend
  const rate = useMutation({
    mutationFn: (score: number) => ratingService.rate(contentId, score),
    onSuccess: refresh,
  })

  // Rút lại (Xóa) điểm đánh giá cũ
  const clear = useMutation({
    mutationFn: () => ratingService.clear(contentId),
    onSuccess: refresh,
  })

  const current = hover || mine.data?.score || 0
  const busy = rate.isPending || clear.isPending
  const avg = summary.data?.averageScore
  const total = summary.data?.totalRatings ?? 0

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2 backdrop-blur-md">
      {/* Điểm số trung bình nổi bật */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
        <div className="flex h-7 items-center gap-1 rounded-lg bg-amber-500/15 px-2 font-bold text-amber-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm">{avg && total > 0 ? avg.toFixed(1) : '—'}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {total > 0 ? (
            <span className="whitespace-nowrap">{total} đánh giá</span>
          ) : (
            <span className="whitespace-nowrap">Chưa có đánh giá</span>
          )}
        </div>
      </div>

      {/* Vùng chấm sao tương tác */}
      {isAuth ? (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                aria-label={`Chấm ${n} sao`}
                onMouseEnter={() => setHover(n)}
                onClick={() => rate.mutate(n)}
                className="group p-0.5 transition-transform duration-150 hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`h-4 w-4 transition-colors duration-150 ${
                    n <= current
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                      : 'text-slate-600 group-hover:text-amber-300/50'
                  }`}
                />
              </button>
            ))}
          </div>

          {mine.data && (
            <div className="flex items-center gap-1 text-[11px] text-amber-300/90">
              <span className="hidden sm:inline">({mine.data.score}★)</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => clear.mutate()}
                className="text-slate-400 underline decoration-slate-600 transition-colors hover:text-rose-400"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="h-3 w-3 text-amber-400/70" />
          <span>Đăng nhập để đánh giá</span>
        </div>
      )}
    </div>
  )
}

export default RatingStars
