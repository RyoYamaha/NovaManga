import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RegistrationRole = 'Reader' | 'Author' | 'Publisher'

interface RegistrationTermsDialogProps {
  role: RegistrationRole
  onAccept: () => void
  onCancel: () => void
}

const roleTitles: Record<RegistrationRole, string> = {
  Reader: 'Người đọc',
  Author: 'Tác giả',
  Publisher: 'Nhà xuất bản',
}

export function RegistrationTermsDialog({
  role,
  onAccept,
  onCancel,
}: RegistrationTermsDialogProps) {
  const [accepted, setAccepted] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements.item(0)
        const lastElement = focusableElements.item(focusableElements.length - 1)
        if (!firstElement || !lastElement) return

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-terms-title"
        aria-describedby="registration-terms-description"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="space-y-1">
            <h2 id="registration-terms-title" className="text-xl font-bold">
              Điều khoản NovaManga
            </h2>
            <p id="registration-terms-description" className="text-sm text-muted-foreground">
              Áp dụng cho tài khoản {roleTitles[role]}. Vui lòng đọc trước khi tạo tài khoản.
            </p>
          </div>
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đóng điều khoản"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 text-sm leading-6 sm:p-6">
          <section className="space-y-2">
            <h3 className="font-semibold">Điều khoản chung</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Tôn trọng quyền sở hữu trí tuệ. Chỉ đọc, đăng tải hoặc sử dụng truyện trong phạm vi
                quyền được chủ sở hữu cho phép.
              </li>
              <li>
                Không sao chép, phát tán lại nội dung, chia sẻ tài khoản hoặc dùng công cụ tự động
                để thu thập nội dung trái phép.
              </li>
              <li>
                Bạn chịu trách nhiệm về bình luận, đánh giá, nội dung và hoạt động phát sinh từ tài
                khoản của mình. NovaManga có thể ẩn nội dung vi phạm và hạn chế tài khoản.
              </li>
              <li>
                Thông tin tài khoản, hoạt động đọc và giao dịch có thể được xử lý để vận hành dịch
                vụ, hỗ trợ người dùng, bảo vệ bản quyền và đáp ứng yêu cầu pháp luật.
              </li>
            </ul>
          </section>

          {role === 'Reader' && (
            <section className="space-y-2">
              <h3 className="font-semibold">Điều khoản dành cho Người đọc</h3>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Quyền đọc truyện chỉ phục vụ mục đích cá nhân; mua quyền đọc không chuyển quyền
                  sở hữu hay quyền khai thác thương mại nội dung.
                </li>
                <li>
                  Khi mở khóa truyện trả phí, giao dịch áp dụng cho bộ truyện và các chương hiện có
                  hoặc được đăng thêm theo cách hệ thống đang cung cấp.
                </li>
                <li>
                  Coin chỉ sử dụng trong NovaManga, không phải tiền điện tử và không được chuyển
                  nhượng. Việc nạp coin không mặc nhiên có thể quy đổi thành tiền mặt.
                </li>
                <li>
                  Nếu truyện đã mua bị gỡ hoặc bạn mất quyền đọc do xác nhận vi phạm bản quyền hay
                  chấm dứt quyền phát hành, NovaManga sẽ xem xét hoàn lại số coin đã dùng để mua
                  truyện đó.
                </li>
              </ul>
            </section>
          )}

          {role === 'Author' && (
            <>
              <section className="space-y-2">
                <h3 className="font-semibold">Điều khoản dành cho Tác giả</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Bạn chỉ được đăng tác phẩm do mình sáng tác hoặc có đủ quyền/cho phép hợp lệ
                    để đăng, phân phối và thu phí. Bạn chịu trách nhiệm về quyền đối với truyện,
                    ảnh bìa, hình minh họa và văn bản.
                  </li>
                  <li>
                    Fan Translation là bản dịch cộng đồng, không phải bản phát hành chính thức;
                    phải khai báo tác phẩm và nguồn gốc. Theo hệ thống NovaManga, loại nội dung này
                    được đăng miễn phí và không tạo doanh thu cho người dịch.
                  </li>
                  <li>
                    Việc mua hoặc sở hữu bản gốc, ghi nguồn, tự dịch hay đăng miễn phí không tự
                    tạo quyền dịch hoặc phát hành lại tác phẩm. Hãy đăng bản dịch chỉ khi có quyền
                    hoặc sự cho phép cần thiết.
                  </li>
                  <li>
                    Với truyện Original trả phí, phần doanh thu ghi nhận cho Tác giả hiện là 60%;
                    phần còn lại là doanh thu nền tảng. Điều kiện và ngưỡng rút tiền được áp dụng
                    theo cài đặt hiển thị trong hệ thống.
                  </li>
                </ul>
              </section>

              <section className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="font-semibold text-destructive">
                  Xử lý truyện lậu hoặc nội dung không có quyền đăng
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Khi nhận được báo cáo có căn cứ hoặc phát hiện dấu hiệu đáng tin cậy, NovaManga
                    có thể tạm ẩn truyện/chương bị phản ánh, dừng giao dịch liên quan và tạm giữ
                    khoản doanh thu liên quan trong khi xác minh.
                  </li>
                  <li>
                    Bạn có thể được yêu cầu cung cấp bằng chứng về quyền đăng tải trong vòng 7 ngày
                    kể từ thông báo. Trong thời gian xem xét, nội dung có thể tiếp tục bị ẩn để hạn
                    chế thiệt hại.
                  </li>
                  <li>
                    Nếu xác minh có vi phạm hoặc bạn không cung cấp được căn cứ phù hợp, nội dung
                    sẽ bị gỡ; doanh thu chưa thanh toán phát sinh từ nội dung vi phạm có thể bị hủy
                    hoặc điều chỉnh; độc giả mất quyền truy cập được xem xét hoàn coin.
                  </li>
                  <li>
                    Vi phạm có thể bị ghi nhận cảnh cáo (strike) và hạn chế quyền đăng. Việc cố ý
                    đăng truyện lậu để thu phí, dùng giấy tờ giả, tái phạm hoặc né biện pháp xử lý
                    có thể dẫn đến chặn rút tiền liên quan, khóa tài khoản lâu dài hoặc vĩnh viễn.
                  </li>
                  <li>
                    Bạn có quyền gửi giải trình và bằng chứng để kháng nghị. Nếu không xác nhận
                    được vi phạm, NovaManga sẽ xem xét khôi phục nội dung và khoản doanh thu bị tạm
                    giữ. Thông tin có thể được chuyển cho chủ sở hữu quyền hoặc cơ quan có thẩm
                    quyền khi có căn cứ và yêu cầu phù hợp.
                  </li>
                </ul>
              </section>
            </>
          )}

          {role === 'Publisher' && (
            <>
              <section className="space-y-2">
                <h3 className="font-semibold">Điều khoản dành cho Nhà xuất bản</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Bạn xác nhận có thẩm quyền đại diện tổ chức và cung cấp thông tin, giấy tờ xác
                    minh chính xác, hợp lệ. Hồ sơ cần được Ban quản trị duyệt trước khi tài khoản
                    Publisher được kích hoạt.
                  </li>
                  <li>
                    Bạn chỉ đăng tải nội dung trong phạm vi quyền, lãnh thổ và thời hạn giấy phép;
                    phải cung cấp bằng chứng khi được yêu cầu và thông báo khi quyền phát hành hết
                    hạn, bị thu hẹp hoặc chấm dứt.
                  </li>
                  <li>
                    Việc hồ sơ được duyệt không thay thế trách nhiệm của bạn về quyền đối với từng
                    tác phẩm. Nội dung bị khiếu nại có thể tạm ẩn trong thời gian xác minh.
                  </li>
                  <li>
                    Với truyện Licensed trả phí, phần doanh thu ghi nhận cho Nhà xuất bản hiện là
                    80%; phần còn lại là doanh thu nền tảng. Điều kiện và ngưỡng rút tiền được áp
                    dụng theo cài đặt hiển thị trong hệ thống.
                  </li>
                  <li>
                    Khi truyện bị gỡ hoặc mất quyền phát hành khiến độc giả không thể tiếp tục đọc,
                    NovaManga sẽ xem xét hoàn coin cho độc giả đã mua.
                  </li>
                </ul>
              </section>

              <section className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="font-semibold text-destructive">Khiếu nại bản quyền</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Bạn có thể gửi khiếu nại kèm bằng chứng về quyền của mình. Khiếu nại phải trung
                    thực, có căn cứ và không nhằm cản trở cạnh tranh.
                  </li>
                  <li>
                    NovaManga có thể tạm ẩn nội dung bị khiếu nại và tạm giữ khoản doanh thu liên
                    quan trong khi xem xét; quyết định xử lý được thông báo cho các bên liên quan.
                  </li>
                  <li>
                    Khiếu nại sai sự thật hoặc cố ý lạm dụng có thể bị từ chối, cảnh cáo hoặc hạn
                    chế quyền khiếu nại.
                  </li>
                </ul>
              </section>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            NovaManga có thể cập nhật điều khoản và yêu cầu bạn xác nhận lại khi có thay đổi quan
            trọng. Nội dung này là điều khoản sử dụng trên nền tảng, không thay thế tư vấn pháp lý.
          </p>
        </div>

        <footer className="space-y-4 border-t border-border p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              {role === 'Publisher'
                ? 'Tôi xác nhận có thẩm quyền đại diện và đồng ý với Điều khoản NovaManga dành cho Nhà xuất bản.'
                : `Tôi đã đọc và đồng ý với Điều khoản NovaManga dành cho ${roleTitles[role]}.`}
            </span>
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Để sau
            </Button>
            <Button type="button" disabled={!accepted} onClick={onAccept}>
              Đồng ý và tạo tài khoản
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
