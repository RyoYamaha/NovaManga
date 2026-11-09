import { ArrowRight, BookOpen, FileText, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

export function CreateStory() {
  const role = useAuthStore((state) => state.user?.role)
  const uploadPath = role === 'Publisher' ? '/publisher/upload' : '/author/upload'

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-4">
      {/* 1. HEADER */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Sáng tác & Phát hành</span>
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Tạo Tác Phẩm Mới</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Chọn định dạng tác phẩm bạn muốn phát hành lên nền tảng Nova Manga.
        </p>
      </div>

      {/* 2. FORMAT CHOICE CARDS */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Manga Card */}
        <Link
          to={`${uploadPath}/manga`}
          className="group flex min-h-60 flex-col justify-between rounded-2xl border border-white/10 bg-[#131b26] p-7 shadow-sm transition-all duration-300 hover:border-primary/50 hover:bg-[#182333] hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="space-y-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-400 shadow-md">
              <BookOpen className="h-7 w-7" />
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                  Truyện Tranh (Manga)
                </h2>
                <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  Ảnh vẽ
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đăng tải các tác phẩm truyện tranh dạng Webtoon cuộn dọc hoặc Manga trang lật với hình ảnh sắc nét.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-bold text-primary">
            <span>Bắt đầu tạo Manga</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
          </div>
        </Link>

        {/* Novel Card */}
        <Link
          to={`${uploadPath}/novel`}
          className="group flex min-h-60 flex-col justify-between rounded-2xl border border-white/10 bg-[#131b26] p-7 shadow-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-[#182333] hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <div className="space-y-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 shadow-md">
              <FileText className="h-7 w-7" />
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Tiểu Thuyết (Novel)
                </h2>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Văn bản & PDF
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đăng tải Light Novel hoặc tiểu thuyết chữ với trình đọc tùy biến cỡ chữ, màu nền hoặc file PDF gốc.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-bold text-emerald-400">
            <span>Bắt đầu tạo Novel</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
          </div>
        </Link>
      </div>
    </section>
  )
}

export default CreateStory
