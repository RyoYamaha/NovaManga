import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Home,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenrePreferenceGrid } from '@/features/catalog/components/GenrePreferenceGrid'
import { contentService } from '@/services/content.service'
import { preferenceService } from '@/features/catalog/api/preference.service'
import { useAuthStore } from '@/stores/auth-store'

export function GenrePreferences() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [selectedGenres, setSelectedGenres] = useState<string[] | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: async () => (await contentService.getGenres()).data,
  })

  const preferencesQuery = useQuery({
    queryKey: ['genre-preferences'],
    queryFn: async () => (await preferenceService.getGenrePreferences()).data,
  })

  const selectedIds = selectedGenres ?? preferencesQuery.data?.genres.map(({ id }) => id) ?? []

  if (user?.role !== 'Reader') return <Navigate to="/" replace />

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((current) => {
      const currentIds = current ?? preferencesQuery.data?.genres.map(({ id }) => id) ?? []
      if (currentIds.includes(genreId)) {
        setMessage(null)
        return currentIds.filter((id) => id !== genreId)
      }
      if (currentIds.length >= 5) {
        setMessage({
          text: 'Bạn đã chọn tối đa 5 thể loại. Vui lòng bỏ chọn bớt một thể loại trước khi thêm mới.',
          type: 'warning',
        })
        return currentIds
      }
      setMessage(null)
      return [...currentIds, genreId]
    })
  }

  const resetSelection = () => {
    setSelectedGenres([])
    setMessage(null)
  }

  const savePreferences = async () => {
    if (selectedIds.length < 3) {
      setMessage({
        text: `Vui lòng chọn thêm ít nhất ${3 - selectedIds.length} thể loại nữa (tối thiểu 3 thể loại).`,
        type: 'warning',
      })
      return
    }
    if (selectedIds.length > 5) {
      setMessage({
        text: 'Chỉ được chọn tối đa 5 thể loại yêu thích.',
        type: 'warning',
      })
      return
    }

    setIsSaving(true)
    setMessage(null)
    try {
      const { data } = await preferenceService.saveGenrePreferences(selectedIds)
      setUser({ ...user, onboardingCompletedAt: data.onboardingCompletedAt })
      setSelectedGenres(null)
      setMessage({
        text: 'Đã lưu sở thích thể loại thành công! Mục gợi ý truyện trên trang chủ đã được cập nhật theo gu của bạn.',
        type: 'success',
      })
      await preferencesQuery.refetch()
    } catch {
      setMessage({
        text: 'Không thể lưu sở thích lúc này. Vui lòng kiểm tra kết nối và thử lại.',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const count = selectedIds.length
  const isSatisfied = count >= 3 && count <= 5

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-3 py-5 sm:px-6">
      {/* 0. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-white">
          <Home className="h-3.5 w-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="text-slate-300">Cài đặt</span>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="font-semibold text-primary">Sở thích thể loại</span>
      </nav>

      {/* 1. HERO HEADER CARD */}
      <section className="rounded-xl border border-white/10 bg-[#202d3d] p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Cá nhân hóa trải nghiệm</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sở thích thể loại truyện
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Chọn từ <strong className="text-amber-400 font-bold">3 đến 5 thể loại</strong> bạn yêu thích nhất để thuật toán gợi ý truyện phù hợp với gu đọc của riêng bạn.
            </p>
          </div>

          {/* Hộp đếm & Thanh tiến trình 5 nấc */}
          <div className="flex min-w-[220px] flex-col gap-2 rounded-lg border border-white/10 bg-[#1a2533] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Tiến độ lựa chọn</span>
              <span className={`font-black text-sm ${isSatisfied ? 'text-amber-400' : 'text-slate-200'}`}>
                {count}/5
              </span>
            </div>

            {/* Thanh tiến trình 5 đoạn trực quan */}
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((index) => {
                const isFilled = index <= count
                const isTarget = index <= 3
                return (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                      isFilled
                        ? 'bg-primary'
                        : isTarget
                        ? 'bg-white/15'
                        : 'bg-white/5'
                    }`}
                  />
                )
              })}
            </div>

            {/* Chỉ báo trạng thái ngắn gọn */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tối thiểu 3</span>
              <span>Tối đa 5</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOADING / ERROR STATES */}
      {(genresQuery.isLoading || preferencesQuery.isLoading) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#202d3d] p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-slate-200">Đang tải danh sách thể loại...</p>
        </div>
      )}

      {(genresQuery.isError || preferencesQuery.isError) && (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-1" />
          <p className="text-sm text-destructive font-semibold">
            Không thể tải dữ liệu sở thích thể loại.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void genresQuery.refetch()
              void preferencesQuery.refetch()
            }}
            className="rounded-xl border-destructive/30 hover:bg-destructive/10"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* 3. LƯỚI THỂ LOẠI TRỰC QUAN */}
      {genresQuery.data && preferencesQuery.data && (
        <>
          <GenrePreferenceGrid
            genres={genresQuery.data}
            selectedIds={selectedIds}
            count={count}
            onToggleGenre={toggleGenre}
          />

          {/* 4. THANH ĐIỀU KHIỂN & LƯU (ACTION FOOTER) */}
          <div className="sticky bottom-3 z-20 rounded-xl border border-white/15 bg-[#202d3d] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Bên trái: Thông điệp trạng thái */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isSatisfied ? (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        Đã chọn {count}/5 thể loại. Sẵn sàng lưu sở thích!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>
                        Cần chọn thêm ít nhất {3 - count} thể loại nữa ({count}/3)
                      </span>
                    </div>
                  )}

                  {count > 0 && (
                    <button
                      type="button"
                      onClick={resetSelection}
                      className="ml-3 text-xs text-slate-400 underline decoration-slate-600 transition-colors hover:text-white"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                {message && (
                  <p
                    role="alert"
                    className={`text-xs ${
                      message.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : message.type === 'warning'
                        ? 'text-amber-300'
                        : 'text-destructive font-semibold'
                    }`}
                  >
                    {message.text}
                  </p>
                )}
              </div>

              {/* Bên phải: Nút Lưu sở thích */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={() => void savePreferences()}
                  disabled={!isSatisfied || isSaving}
                  size="lg"
                  className={`rounded-lg px-6 font-semibold ${
                    isSatisfied
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Lưu sở thích
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GenrePreferences
