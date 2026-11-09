import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Sparkles,
  Bookmark,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenreSelectionStep } from '@/features/catalog/components/GenreSelectionStep'
import { OnboardingCoinStep, OnboardingReaderStep } from '@/features/catalog/components/OnboardingInformationSteps'
import { contentService } from '@/services/content.service'
import { preferenceService } from '@/features/catalog/api/preference.service'
import { useAuthStore } from '@/stores/auth-store'

export function Onboarding() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)
  const [step, setStep] = useState(0)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lấy dữ liệu tác phẩm THẬT từ backend (ComicK / Netflix style showcase)
  const contentsQuery = useQuery({
    queryKey: ['onboarding-contents'],
    queryFn: async () => {
      const res = await contentService.getAll({
        publicationStatus: 'Published',
        limit: 10,
      })
      return res.data.items
    },
  })

  // Lấy danh sách thể loại THẬT từ backend
  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: async () => (await contentService.getGenres()).data,
  })

  if (user?.onboardingCompletedAt) return <Navigate to="/" replace />

  const isGenreStep = step === 3
  const realContents = contentsQuery.data ?? []

  const finishOnboarding = async (genreIds: string[]) => {
    setError(null)
    setIsSaving(true)
    try {
      const { data } = await preferenceService.saveGenrePreferences(genreIds)
      if (user) setUser({ ...user, onboardingCompletedAt: data.onboardingCompletedAt })
      navigate('/', { replace: true })
    } catch {
      setError('Không thể lưu lựa chọn lúc này. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((current) =>
      current.includes(genreId)
        ? current.filter((selectedId) => selectedId !== genreId)
        : current.length < 5
          ? [...current, genreId]
          : current,
    )
    setError(null)
  }

  const handleNext = () => {
    if (isGenreStep) {
      if (selectedGenres.length < 3) {
        setError('Vui lòng chọn ít nhất 3 thể loại để tiếp tục.')
        return
      }
      void finishOnboarding(selectedGenres)
      return
    }
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((prev) => prev - 1)
  }

  const stepLabels = ['Giới thiệu', 'Hệ thống Coin', 'Trình đọc', 'Thể loại']

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#1a2533] px-4 sm:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-base font-black tracking-tight text-white">NovaManga</span>
        </div>

        {/* ComicK / Netflix Style Stepper Tabs */}
        <div className="hidden sm:flex items-center gap-2">
          {stepLabels.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => idx <= step && setStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                idx === step
                  ? 'bg-white/10 text-white'
                  : idx < step
                    ? 'text-primary hover:text-white cursor-pointer'
                    : 'text-muted-foreground/60 cursor-default'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  idx === step
                    ? 'bg-primary text-primary-foreground'
                    : idx < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-white/5 text-muted-foreground'
                }`}
              >
                {idx < step ? <Check className="h-2.5 w-2.5" /> : idx + 1}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Skip action */}
        <Button
          variant="ghost"
          size="sm"
          disabled={isSaving}
          onClick={() => void finishOnboarding([])}
          className="text-xs text-muted-foreground hover:text-white"
        >
          Bỏ qua
        </Button>
      </header>

      {/* Progress line */}
      <div className="w-full bg-white/5 h-0.5">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 max-w-6xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* STEP 1: GIỚI THIỆU WEB & KHO NỘI DUNG (Netflix / ComicK Billboard Showcase) */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div className="space-y-8">
            {/* Header statement */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Nền tảng đọc Manga & Novel trực tuyến
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Thế giới truyện tranh & tiểu thuyết của riêng bạn
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                NovaManga là nơi hội tụ các bộ Manga bản quyền, truyện tự sáng tác và các bản dịch chất lượng cao
                từ cộng đồng. Trải nghiệm đọc liền mạch, hình ảnh sắc nét và không quảng cáo phiền toái.
              </p>
            </div>

            {/* Real Content Poster Rail (ComicK / Netflix Style) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Tác phẩm nổi bật trên hệ thống
                </span>
                <span>{realContents.length > 0 ? `${realContents.length} tác phẩm đang phát hành` : 'Cập nhật hàng ngày'}</span>
              </div>

              {realContents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {realContents.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-[3/4.2] overflow-hidden rounded-lg border border-white/10 bg-[#202d3d] hover:border-white/25"
                    >
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-[#202d3d] p-3 text-center">
                          <BookOpen className="h-8 w-8 text-primary/40 mb-2" />
                          <p className="text-xs font-semibold text-white line-clamp-2">{item.title}</p>
                        </div>
                      )}

                      {/* Card Overlay info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                        <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
                          {item.type}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        {item.genres.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {item.genres.slice(0, 2).map((g) => g.genre.name).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-[#131b26]/50 p-8 text-center text-xs text-muted-foreground">
                  Thư viện liên tục cập nhật các tác phẩm mới nhất mỗi ngày từ các tác giả và nhóm dịch.
                </div>
              )}
            </div>

            {/* 3 Core pillars - ComicK style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Manga & Novel trong một nơi</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Đọc cả truyện tranh hình ảnh chất lượng cao và tiểu thuyết với giao diện tùy biến.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Trải nghiệm đọc mượt mà</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Không quảng cáo che khuất khung hình, tốc độ tải trang nhanh và ổn định.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Lưu tủ sách & Lịch sử đọc</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Đồng bộ tức thì chương đang đọc dở trên mọi thiết bị bạn sử dụng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && <OnboardingCoinStep />}

        {step === 2 && <OnboardingReaderStep />}

        {/* ========================================================================= */}
        {/* STEP 4: CÁ NHÂN HÓA NGUỒN CẤP THEO THỂ LOẠI (Dữ liệu thật từ Backend API) */}
        {/* ========================================================================= */}
        {step === 3 && (
          <GenreSelectionStep
            genres={genresQuery.data}
            selectedGenreIds={selectedGenres}
            isLoading={genresQuery.isLoading}
            isError={genresQuery.isError}
            onToggleGenre={toggleGenre}
            onClear={() => setSelectedGenres([])}
            onRetry={() => void genresQuery.refetch()}
          />
        )}
      </main>

      {/* FOOTER ACTION BAR */}
      <footer className="sticky bottom-0 z-30 flex h-16 w-full items-center justify-between border-t border-white/10 bg-[#1a2533] px-4 sm:px-8">
        <div>
          {step > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleBack}
              className="text-xs border-white/10 hover:bg-white/5 cursor-pointer"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Quay lại
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground hidden sm:inline">Khám phá NovaManga trong 1 phút</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
          <Button
            size="sm"
            disabled={isSaving || (isGenreStep && (genresQuery.isLoading || genresQuery.isError))}
            onClick={handleNext}
            className="text-xs font-bold px-6 cursor-pointer"
          >
            {isSaving ? 'Đang lưu...' : isGenreStep ? 'Hoàn tất & Khám phá ngay' : 'Tiếp tục'}
            {!isSaving && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default Onboarding
