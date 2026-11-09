import { type FormEvent } from 'react' //Đây là kiểu dữ liệu TypeScript đại diện cho sự kiện submit form.
import { useParams, Link } from 'react-router' 
//useParam : nhận tham số từ url 
//Link: tạo điều hướng giữa các trang mà không cần phải tải lại toàn bộ  
import { ArrowLeft, Bot, Compass, MessageSquare, Send, Sparkles, Layers,BookOpen, AlertCircle, HelpCircle} from 'lucide-react'
//thư viện icon 

//import các component dùng chung 
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDialog } from '@/components/common/AppDialogProvider' //chức năng hiển thị hộp thoại xác nhận 

//import các component riêng của AI 
import { useAiChat } from '@/features/ai/hooks/useAiChat'
import { AiMessageItem } from '@/features/ai/components/AiMessageItem'
import { AiNovelContextCard } from '@/features/ai/components/AiNovelContextCard'
import { AiQuickPrompts } from '@/features/ai/components/AiQuickPrompts'
import { AiQuotaBadge } from '@/features/ai/components/AiQuotaBadge'
import { AiSessionSidebar } from '@/features/ai/components/AiSessionSidebar'

//khởi tạo component Ai Assistant 
export function AiAssistant() {
  // Đọc ID truyện trên URL để mở trợ lý cùng ngữ cảnh nếu có.
    const { contentId } = useParams<{ contentId: string }>() 
  //lấy contentId , xem chat có gắn với tiểu thuyết nào không
  const { confirm } = useAppDialog() 
  //lấy hàm confirm 


  //gọi customhook của useAichat, lấy ra rất nhiều giá trị 
  //quản lý dữ liệu , trạng thái và thao tác của chức năng chat 
  const {
    user, //thông tin người dùng -data
    messages, //danh sách tin nhắn  - data 
    input, //nội dung người dùng đang nhập -state 
    setInput, //cập nhật nội dung nhập - function 
    activeSessionId, //id phiên chat đang chọn  - data
    currentNovel, //tiểu thuyết đang được gán ngữ cảnh - data 
    status, //trạng thái sử dụng AI  - data 
    sessions, //danh sách phiên chat - data 
    isStatusLoading, //đang tải trạng thái Ai - state  
    isSending, //dang gửi tin nhắn  - state 
    errorMessage, // thông báo lỗi -data  
    messagesEndRef, //tham chiếu đến cuối danh sách tin nhắn - ref

    //ở dưới full function 
    sendMessage, //gửi tin nhắn 
    startNewChat, // tạo phiên chat mới 
    chooseSession, //chọn phiên chat 
    clearNovelContext, //xóa ngữ cảnh tiểu thuyết 
    deleteSession, //xóa phiên chat 
    refetchStatus, //tải lại trạng thái Ai 
  } = useAiChat({ initialContentId: contentId })

  // Yêu cầu xác nhận trước khi xóa vĩnh viễn một phiên trò chuyện.
  const handleDeleteSession = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xóa cuộc trò chuyện?',
      description: 'Toàn bộ tin nhắn trong phiên này sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      confirmLabel: 'Xóa trò chuyện',
      tone: 'destructive',
    })
    if (confirmed) {
      deleteSession(id)
    }
  }

  // Chặn hành vi submit mặc định của trình duyệt rồi gửi câu hỏi qua hook chat.
  const handleFormSubmit = (e: FormEvent) => { //nhận sự kiện submit từ form 

    e.preventDefault()
    sendMessage()
  }

  // Chỉ tài khoản độc giả được truy cập giao diện trợ lý AI.
  // 0. Giới hạn chỉ người dùng (role 'Reader') mới có giao diện AI
  if (user?.role !== 'Reader') {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-white/10 bg-[#202d3d] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <Bot className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">Trợ lý AI dành cho Độc giả</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Tính năng Trợ lý AI tra cứu Novel hiện chỉ hỗ trợ cho tài khoản người dùng / độc giả.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Hiển thị trạng thái chờ trong lúc tải thông tin khả dụng của AI.
  // 1. Kiểm tra trạng thái loading : cho biết quá trình tải trạng thái Ai có đang diễn ra hay không
  if (isStatusLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Đang tải Trợ lý AI Nova...</p>
      </div>
    )
  }

  // Thông báo riêng nếu AI đang bảo trì hoặc tài khoản bị khóa quyền sử dụng.
  // kiểm tra xem Ai có được phép sử dụng hay không 
  if (status && !status.available) { //Ai có khả dụng hay không 
    const isBlocked = status.blocked //tài khoản có bị khóa quyền Ai hay không 
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-white/10 bg-[#202d3d] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">
          {isBlocked ? 'Tài khoản tạm dừng sử dụng AI' : 'Trợ lý AI đang tạm tắt'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {isBlocked
            ? 'Quyền sử dụng Trợ lý AI của tài khoản bạn đang bị khóa bởi Quản trị viên. Bạn vẫn có thể đọc và tương tác truyện bình thường.'
            : 'Hệ thống trợ lý AI hiện đang được bảo trì. Bạn có thể sử dụng tính năng tìm kiếm thông thường để duyệt truyện.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/">Về trang chủ</Link>
            //nút thử lại nếu Ai không khả dụng 
          </Button>
          <Button variant="default" onClick={() => void refetchStatus()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const novelTitle = currentNovel?.title //lấy tiêu đề tiểu thuyết 


  // ============== RENDER GIAO DIỆN CHÍNH CỦA TRỢ LÝ AI  ===================
  return (
    <div className="mx-auto flex h-[calc(100vh-6.5rem)] max-w-7xl overflow-hidden rounded-xl border border-white/10 bg-[#202d3d]">
      {/* 1. SIDEBAR:component hiển thị danh sách các phiên trò chuyện ở bên trái.) */}
        <AiSessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={chooseSession}
        onNewChat={() => startNewChat()}
        onDeleteSession={handleDeleteSession}
        className="hidden w-72 shrink-0 border-r border-white/10 md:flex"
      />

      {/* 2. MAIN CHAT AREA */}
      <section className="flex min-w-0 flex-1 flex-col bg-[#1d2938]">
        {/* Thanh tiêu đề: quay lại truyện, nhận diện trợ lý và bắt đầu phiên mới */}

        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl px-2 text-muted-foreground hover:text-white"
            >
              <Link to={contentId ? `/content/${contentId}` : '/'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm sm:text-base font-bold text-white">
                  Trợ lý AI Nova
                </h1>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  Novel
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {novelTitle ? `Ngữ cảnh: ${novelTitle}` : 'Tra cứu metadata & Gợi ý tiểu thuyết'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AiQuotaBadge status={status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => startNewChat()} //tạo chat mới 
              className="hidden sm:flex rounded-xl border-white/10 text-xs"
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Đoạn chat mới
            </Button>
          </div>
        </header>

        {/* Hiển thị truyện đang làm ngữ cảnh và cho phép gỡ ngữ cảnh đó */}
        {currentNovel && (
          <div className="border-b border-white/5 bg-white/[0.01] px-4 py-2.5 sm:px-6">
            <AiNovelContextCard
              novelId={currentNovel.id}
              novelTitle={currentNovel.title}
              coverImageUrl={currentNovel.coverImageUrl}
              genres={currentNovel.genres?.map((g) => g.genre.name)}
              onClear={clearNovelContext}
            />
          </div>
        )}

        {/* Khu vực hội thoại: lời chào ban đầu, tin nhắn, trạng thái và lỗi */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Khi chưa có tin nhắn, giới thiệu trợ lý và các thao tác gợi ý để bắt đầu */}
          {messages.length === 0 && (
            <div className="mx-auto max-w-2xl py-8 sm:py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">
                Xin chào{user?.username ? `, ${user.username}` : ''}!
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Mình là Trợ lý AI Nova, chuyên hỗ trợ tra cứu thông tin tiểu thuyết, tìm kiếm theo thể loại và gợi ý truyện phù hợp mà không tiết lộ nội dung cốt truyện.
              </p>

              {/* Thẻ câu hỏi mẫu theo các nhóm chức năng của trợ lý */}
              {/* Starter feature cards */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                <StarterCard
                  icon={<Compass className="h-5 w-5 text-sky-400" />}
                  title="Tìm kiếm & Khám phá"
                  description="Tìm tiểu thuyết theo thể loại, tag, tình trạng hoàn thành hoặc tác giả."
                  onClick={() =>
                    sendMessage('Gợi ý cho mình 5 bộ tiểu thuyết huyền huyễn hoặc phiêu lưu hay nhất.')
                  }
                />
                <StarterCard
                  icon={<BookOpen className="h-5 w-5 text-amber-400" />}
                  title="Thông tin tác phẩm"
                  description="Tra cứu số chương, chương miễn phí, giá coin và đánh giá trung bình."
                  onClick={() =>
                    sendMessage('Truyện nào trên hệ thống hiện có nhiều chương đọc thử miễn phí nhất?')
                  }
                />
                <StarterCard
                  icon={<Layers className="h-5 w-5 text-emerald-400" />}
                  title="Gợi ý tương tự"
                  description="Tìm các bộ tiểu thuyết có nội dung, bối cảnh tương đồng với bộ bạn thích."
                  onClick={() =>
                    sendMessage('Tìm những bộ tiểu thuyết tương tự phong cách trọng sinh / tu tiên.')
                  }
                />
                <StarterCard
                  icon={<HelpCircle className="h-5 w-5 text-purple-400" />}
                  title="Quy định nền tảng"
                  description="Hỏi về cơ chế đọc truyện, ví coin, chính sách bản quyền và tác quyền."
                  onClick={() =>
                    sendMessage('Quy định đọc thử và mở khóa chương trên NovaManga hoạt động thế nào?')
                  }
                />
              </div>
            </div>
          )}

          {/* Hiển thị lần lượt các tin nhắn trong phiên hiện tại */}
          {/* Render individual messages */}
          {messages.map((message) => (
            <AiMessageItem key={message.id} message={message} />
          ))}

          {/* Báo hiệu AI đang xử lý câu hỏi hoặc tra cứu dữ liệu */}
          {/* Thinking / Searching indicator */}
          {isSending && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground animate-pulse">
              <Sparkles className="h-4 w-4 animate-spin text-primary" />
              <span>AI đang tra cứu dữ liệu từ hệ thống...</span>
            </div>
          )}

          {/* Hiển thị lỗi phát sinh khi gửi hoặc xử lý câu hỏi */}
          {/* Error notice */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Các câu hỏi gợi ý nhanh; khóa thao tác khi đang gửi hoặc hết lượt */}
        {/* Quick Prompts row */}
        <div className="border-t border-white/5 bg-white/[0.01] px-4 py-2 sm:px-6">
          <AiQuickPrompts
            hasNovelContext={Boolean(currentNovel)}
            disabled={isSending || status?.limitReached}
            onSelectPrompt={(prompt) => sendMessage(prompt)}
          />
        </div>

        {/* Thanh nhập và gửi câu hỏi cho trợ lý AI */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 border-t border-white/10 p-3.5 sm:p-4 bg-[#0a0e16]"
        >
          {/* Ô nhập câu hỏi; placeholder thay đổi theo lượt hỏi và truyện đang chọn */}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            placeholder={
              status?.limitReached
                ? 'Bạn đã hết lượt hỏi AI trong ngày...'
                : currentNovel
                  ? `Hỏi bất kỳ điều gì về "${currentNovel.title}"...`
                  : 'Hỏi về tiểu thuyết, thể loại hoặc gợi ý truyện...'
            }
            disabled={isSending || status?.limitReached}
            className="h-11 rounded-2xl border-white/10 bg-[#0f1722] px-4 text-sm focus-visible:ring-primary/40"
          />
          {/* Nút gửi; khóa khi nội dung rỗng, đang gửi hoặc đã hết lượt hỏi */}
          <Button
            type="submit"
            disabled={!input.trim() || isSending || status?.limitReached}
            className="h-11 w-11 shrink-0 rounded-2xl px-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95"
            title="Gửi câu hỏi"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </section>
    </div>
  )
}

// Thẻ gợi ý trên màn hình mở đầu; chọn thẻ sẽ gửi câu hỏi mẫu vào hội thoại.
function StarterCard({ icon, title, description, onClick,}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.05] hover:scale-[1.01] active:scale-[0.99]"
    >
      {/* Biểu tượng và tiêu đề giúp nhận biết nhanh nhóm tính năng */}
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl bg-white/5 p-2 transition-colors group-hover:bg-primary/10">
          {icon}
        </div>
        <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
          {title}
        </h4>
      </div>
      {/* Mô tả ngắn nội dung mà câu hỏi gợi ý có thể hỗ trợ */}
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </p>
    </button>
  )
}

export default AiAssistant
