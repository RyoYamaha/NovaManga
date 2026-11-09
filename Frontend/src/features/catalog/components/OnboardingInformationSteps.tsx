import {
  Bookmark,
  CheckCircle2,
  Coins,
  MessageSquare,
  Sliders,
  Smartphone,
} from 'lucide-react'

export function OnboardingCoinStep() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2.5 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Coins className="h-3.5 w-3.5" /> Cơ chế đọc truyện &amp; Hệ thống Coin
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
          Đọc linh hoạt · Minh bạch chi tiêu
        </h1>
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          NovaManga không áp dụng gói cước định kỳ bắt buộc. Bạn luôn được đọc thử các chương đầu miễn phí
          và chỉ sử dụng Coin khi thực sự muốn mở khóa tiếp.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Giai đoạn 1
              </span>
              <span className="text-xs text-muted-foreground">Miễn phí 100%</span>
            </div>
            <h3 className="text-base font-bold text-white">Đọc thử các chương đầu</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mọi tác phẩm trên nền tảng đều mở sẵn từ 3 đến 5 chương đầu để bạn cảm nhận cốt truyện, nét vẽ
              và văn phong trước khi quyết định theo dõi lâu dài.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 pt-3 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Không cần nhập thẻ thanh toán</span>
          </div>
        </div>

        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-amber-500/30 bg-[#131b26] p-5 shadow-lg shadow-amber-950/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
                Giai đoạn 2
              </span>
              <span className="text-xs font-medium text-amber-300">Linh hoạt</span>
            </div>
            <h3 className="text-base font-bold text-white">Mở khóa từng chương bằng Coin</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Khi muốn đọc tiếp các chương mới hoặc chương VIP, bạn chỉ cần dùng Coin cho đúng chương bạn chọn.
              Giá Coin được niêm yết rõ ràng trước khi xác nhận mở khóa.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 pt-3 text-xs font-medium text-amber-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Không tự động trừ tiền âm thầm</span>
          </div>
        </div>

        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                Giai đoạn 3
              </span>
              <span className="text-xs text-muted-foreground">Vĩnh viễn</span>
            </div>
            <h3 className="text-base font-bold text-white">Sở hữu vĩnh viễn &amp; Ủng hộ tác giả</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Chương đã mở khóa thuộc về tài khoản của bạn trọn đời. Doanh thu Coin được chia sẻ trực tiếp
              đến tác giả, dịch giả và nhà xuất bản để tiếp tục ra chương mới.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 pt-3 text-xs font-medium text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Đọc lại bất cứ lúc nào</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0f1622] p-4 text-center text-xs text-muted-foreground">
        💡 <span className="font-semibold text-white">Mẹo dành cho bạn:</span> Bạn có thể nhận thêm Coin miễn phí
        hàng tuần thông qua tính năng điểm danh và các sự kiện độc giả trên NovaManga.
      </div>
    </div>
  )
}

export function OnboardingReaderStep() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2.5 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <Sliders className="h-3.5 w-3.5" /> Trình đọc chuyên biệt cho Manga &amp; Novel
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
          Tối ưu hóa cho mọi thói quen đọc
        </h1>
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Được lấy cảm hứng từ những nền tảng truyện tranh và tiểu thuyết hàng đầu, NovaManga cung cấp đầy đủ
          công cụ giúp bạn có trải nghiệm đọc thoải mái nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Trình đọc Manga đa chế độ</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tùy chỉnh chế độ cuộn dọc liên tục (Webtoon) mượt mà cho điện thoại, hoặc chế độ lật từng trang
            (trang đơn / trang đôi) chuẩn phong cách manga Nhật Bản.
          </p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Sliders className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Tùy biến giao diện đọc Novel</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tự do điều chỉnh kích cỡ chữ, khoảng cách dòng, chuyển đổi màu nền (Dark, Sepia, Black) và phông chữ
            để chống mỏi mắt khi đọc tiểu thuyết nhiều giờ liền.
          </p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Bookmark className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Tủ sách &amp; Đồng bộ tiến độ tự động</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hệ thống tự động ghi nhớ vị trí chương và trang bạn đang đọc dở. Chuyển đổi giữa điện thoại và máy tính
            mà không sợ bị mất dấu câu chuyện.
          </p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#131b26] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Thảo luận &amp; Bình luận cộng đồng</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Chia sẻ cảm nhận, thảo luận các tình tiết bất ngờ và tương tác cùng hàng ngàn độc giả khác
            ngay ở cuối mỗi chương truyện.
          </p>
        </div>
      </div>
    </div>
  )
}
