# NovaManga Project Report

> **Cách dùng:** Thay nội dung trong `[ngoặc vuông]` bằng thông tin và bằng chứng của dự án. Xóa hướng dẫn này trước khi nộp. Không tự tạo số liệu, kết quả kiểm thử, nguồn tham khảo hoặc tính năng chưa triển khai.

## Trang bìa

- Tên đề tài: **NovaManga — nền tảng đọc và quản lý Manga/Novel**
- Sinh viên: [Họ tên, mã sinh viên]
- Chương trình/môn học: [Tên]
- Người hướng dẫn: [Tên]
- Ngày nộp: [Ngày]

## Abstract

[Tóm tắt vấn đề, mục tiêu, giải pháp, công nghệ, kết quả đã kiểm chứng và kết luận trong khoảng 150–250 từ.]

## Table of Contents

[Tạo tự động sau khi hoàn thiện báo cáo.]

# 1. Introduction (Giới thiệu)

## 1.1 Rationale and Motivation (Lý do và động lực)

Các nền tảng đọc truyện số tạo điều kiện để người đọc tiếp cận Manga và Novel trực tuyến, nhưng trải nghiệm tìm kiếm, đọc và quản lý thư viện có thể khác nhau giữa các dịch vụ. Người sáng tạo cũng cần công cụ để đăng tải tác phẩm, theo dõi trạng thái kiểm duyệt và quản lý doanh thu. Đây là vấn đề mà NovaManga lựa chọn tìm hiểu và giải quyết trong phạm vi một ứng dụng web.

NovaManga hướng đến việc kết hợp Manga và Novel trong cùng một nền tảng, đồng thời hỗ trợ các luồng dành cho Reader, Author, Publisher và Admin. Các chức năng khám phá nội dung, lưu thư viện và tiến độ đọc nhằm giúp Reader tiếp tục trải nghiệm giữa các phiên; quy trình đăng tải, kiểm duyệt và thương mại hóa nhằm hỗ trợ người sáng tạo và đơn vị xuất bản.

Những nhận định về mức tăng trưởng của thị trường Việt Nam, mức độ phân mảnh của các nền tảng hiện có hoặc nhu cầu cụ thể của người dùng cần được dẫn chứng bằng nguồn đáng tin cậy, khảo sát hoặc kết quả so sánh ở Chương 2. Nếu chưa có bằng chứng, hãy trình bày đây là động lực và mục tiêu của dự án, không khẳng định như kết luận chung về toàn thị trường.

## 1.2 Project Domain (Lĩnh vực dự án)

NovaManga thuộc lĩnh vực **nền tảng nội dung số (Digital Content Platform)**, tập trung vào việc phân phối và đọc Manga/Novel, hỗ trợ người sáng tạo và quản lý nội dung. Mô hình dữ liệu và các module của hệ thống thể hiện các vai trò Reader, Author, Publisher và Admin.

**Nền tảng đọc thống nhất.** Reader có thể khám phá nội dung, đọc chương và sử dụng các chức năng như bookmark, yêu thích, đánh giá, lịch sử và tiến độ đọc. Trình đọc Manga hiển thị nội dung theo trang ảnh. Trình đọc Novel hỗ trợ văn bản ở chế độ lật trang hoặc cuộn; chương Novel dạng PDF được hiển thị qua các trang ảnh. Với tài khoản đăng nhập, tiến độ trang hiện được lưu/khôi phục cho Manga, Novel lật trang và PDF; Novel ở chế độ cuộn chưa lưu vị trí cuộn. Chỉ mô tả hành vi đã được kiểm thử trên phiên bản nộp.

**Khám phá và gợi ý nội dung.** Hệ thống sử dụng các cơ chế xếp hạng heuristic/rule-based, không phải mô hình machine learning được huấn luyện. Xếp hạng phổ biến kết hợp lượt đọc gần đây trong cửa sổ bảy ngày, lượt yêu thích, bookmark và điểm đánh giá đã điều chỉnh theo Bayesian rating. Gợi ý cá nhân hóa xây dựng mức quan tâm thể loại/tag từ tùy chọn và lịch sử đọc, yêu thích, bookmark; tín hiệu lịch sử giảm dần theo thời gian và điểm xếp hạng còn xét độ phổ biến gần đây, đánh giá và độ mới. Hệ thống cũng có thể đa dạng hóa nhóm kết quả đầu dựa trên độ tương đồng thể loại/tag. Khi trình bày công thức, trọng số và giới hạn ứng viên, đối chiếu trực tiếp với phiên bản mã nguồn được nộp.

**Thương mại hóa và quản lý nội dung.** Hệ thống có các luồng ví coin, tạo yêu cầu nạp tiền với mã chuyển khoản và QR, nhận webhook SePay, mua/mở khóa nội dung trả phí, ghi nhận doanh thu và payout. Webhook cần được đối chiếu với giao dịch và đơn nạp; mã giao dịch ngoài được dùng để nhận diện sự kiện lặp. Author/Publisher đăng tải và quản lý nội dung theo quyền; nội dung được đưa qua các trạng thái kiểm duyệt trước khi xuất bản. Chỉ mô tả quy trình là “minh bạch” nếu báo cáo có tiêu chí và bằng chứng đánh giá được điều đó.

**AI hỗ trợ.** Backend tích hợp DeepSeek API cho trợ lý hỏi đáp về thông tin Novel và hỗ trợ sàng lọc nội dung cần kiểm duyệt. AI là công cụ hỗ trợ, không thay thế quyết định kiểm duyệt của Admin; kết quả có thể sai hoặc gắn cờ nhầm. API key được cấu hình phía máy chủ, không đưa vào frontend. Nêu rõ giới hạn, lỗi dịch vụ, quota và chi phí dựa trên cách hệ thống thực sự xử lý và kết quả kiểm thử.

**Nguồn nội dung và media.** Cấu hình dự án hiện có tích hợp Cloudinary để lưu media và tài liệu được tải lên. Không ghi MangaDex API hay nguồn nội dung bên ngoài khác nếu không xác nhận có sử dụng trong phiên bản nộp.

## 1.3 Technologies and Methodologies (Công nghệ và phương pháp luận)

NovaManga tách giao diện web khỏi backend API và sử dụng TypeScript ở cả hai phía. Sơ đồ kiến trúc và lý do chọn từng công nghệ cần được giải thích chi tiết hơn ở Chương 2 và Chương 4.

### 1.3.1 Backend Architecture (Kiến trúc backend)

Backend được xây dựng bằng NestJS và cung cấp REST API. Mã nguồn được chia thành các module theo miền chức năng; các luồng phổ biến đi từ Controller qua Service đến Prisma/data layer. Cách phân chia này tách nhận request, xử lý nghiệp vụ và truy cập dữ liệu, nhưng không tự động bảo đảm hệ thống dễ kiểm thử hoặc an toàn nếu thiếu kiểm thử và kiểm soát phù hợp.

Xác thực sử dụng JWT qua Bearer token với Passport; các endpoint được bảo vệ bằng guard và kiểm tra quyền theo vai trò. Mô tả chính xác cơ chế access/refresh token, thời hạn, lưu trữ token và xử lý thu hồi dựa trên luồng triển khai thực tế. Không ghi giá trị bí mật vào báo cáo hoặc ảnh chụp cấu hình.

### 1.3.2 Data and Infrastructure (Dữ liệu và hạ tầng)

Lược đồ dữ liệu dùng PostgreSQL; Prisma Client và `@prisma/adapter-pg` được dùng để truy cập cơ sở dữ liệu. Dữ liệu bao gồm người dùng, nội dung, chương, lịch sử/tiến độ đọc, tương tác, ví, đơn nạp, giao dịch và doanh thu. Dự án có cấu hình migration cho PostgreSQL; cần chạy migration trên môi trường triển khai và kiểm tra schema trước khi chuyển lưu lượng thật.

Trong các luồng thanh toán, transaction và ràng buộc duy nhất trên mã giao dịch ngoài hỗ trợ chống xử lý webhook lặp. Đây là biện pháp idempotency ở tầng xử lý; vẫn cần kiểm thử các trường hợp webhook lặp/đồng thời, sai mã, sai số tiền và lỗi giữa chừng. Cloudinary được tích hợp cho media; PostgreSQL và Cloudinary là hai dịch vụ lưu trữ riêng biệt.

### 1.3.3 Frontend (Giao diện)

Frontend sử dụng React, TypeScript và Vite, gọi backend qua REST API bằng Axios. TanStack Query quản lý dữ liệu truy vấn phía máy chủ; Zustand dùng cho một phần state phía giao diện. Tailwind CSS được tích hợp với Vite, cùng các thành phần Base UI và biểu tượng Lucide React. Chỉ giữ trong báo cáo những thư viện còn được sử dụng trong phiên bản cuối.

Giao diện đọc được điều chỉnh theo định dạng: Manga hiển thị các trang ảnh; Novel có chế độ văn bản lật trang/cuộn và chế độ đọc PDF theo trang. Tránh mô tả mọi Novel là “tối ưu cho văn bản” nếu trải nghiệm PDF cũng thuộc phạm vi dự án.

### 1.3.4 AI, Payment and Deployment (AI, thanh toán và triển khai)

**AI:** Backend gọi DeepSeek API; cấu hình model và khóa API nằm ở môi trường máy chủ. Lớp gọi API hiện có retry giới hạn cho lỗi mạng, HTTP 429 và lỗi máy chủ 5xx. Báo cáo cần phân biệt các lỗi đã được xử lý trong mã với các biện pháp vận hành chưa triển khai, như cảnh báo quota, giới hạn ngân sách hay dự phòng nhà cung cấp.

**Thanh toán:** SePay gửi webhook giao dịch ngân hàng đến backend; backend kiểm tra dữ liệu, mã chuyển khoản và đơn nạp trước khi ghi nhận giao dịch/cập nhật ví. VietQR được dùng trong luồng tạo yêu cầu nạp. Cần kiểm thử việc xác thực webhook, giao dịch lặp, giao dịch không khớp và xử lý thủ công; không khẳng định đã kiểm thử với giao dịch tiền thật nếu chưa thực hiện.

**Kế hoạch triển khai:** Dự kiến dùng Supabase cho PostgreSQL, Vercel cho frontend và Render cho backend. Đây là kế hoạch, không phải môi trường đã triển khai, cho đến khi deployment hoàn tất và được kiểm tra. Khi triển khai cần cấu hình `DATABASE_URL` (pooler cho ứng dụng) và `DIRECT_URL` (kết nối trực tiếp cho migration) theo hướng dẫn của dự án; cấu hình `VITE_API_URL` trên Vercel và rewrite/fallback cho các đường dẫn frontend do React Router quản lý; cấu hình biến môi trường backend, CORS cho domain frontend, health check và URL HTTPS webhook trên Render. Không ghi giá trị của secrets vào báo cáo. Sau triển khai, kiểm tra migration, đăng nhập/refresh token, upload Cloudinary, thanh toán webhook thử nghiệm và các luồng đọc chính.

### 1.3.5 Development Methodology (Phương pháp phát triển)

**Phương pháp thực tế cần xác nhận trước khi nộp.** Nếu dự án được phát triển theo từng vòng, có thể mô tả là *iterative development*; chỉ gọi là Scrum/Agile khi thực sự có các thực hành tương ứng. Bổ sung bằng chứng theo dõi công việc như backlog, issue board, kế hoạch sprint, lịch sử commit hoặc biên bản trao đổi. Không suy ra phương pháp luận chỉ từ thứ tự các tính năng trong mã nguồn.

Mô tả thứ tự triển khai, các lần thay đổi phạm vi và cách nhận phản hồi theo lịch sử làm việc thực tế. Nếu không có sprint/backlog chính thức, trình bày trung thực quy trình cá nhân/nhóm đã áp dụng thay vì tạo tài liệu hồi cứu như thể đã dùng từ đầu.

## 1.4 Summary of Report (Tóm tắt báo cáo)

Báo cáo trình bày bối cảnh và động lực xây dựng NovaManga, nghiên cứu các nền tảng liên quan, phân tích yêu cầu của Reader/Author/Publisher/Admin, thiết kế và triển khai hệ thống, sau đó đánh giá bằng kiểm thử và đối chiếu với yêu cầu. Báo cáo kết thúc bằng tổng kết, bài học, hạn chế và hướng phát triển. Sau khi hoàn tất kiểm thử, bổ sung một đến hai câu nêu kết quả có bằng chứng; không ghi số liệu chưa đo hoặc deployment chưa xác nhận.

## 1.5 Report Organization by Chapters (Bố cục báo cáo theo chương)

- **Chương 1 – Introduction:** động lực, lĩnh vực, công nghệ, phương pháp phát triển và bố cục báo cáo.
- **Chương 2 – Literature Review:** bối cảnh nền tảng Manga/Novel số, vấn đề xã hội/pháp lý/đạo đức, khảo sát ứng dụng tương tự, công nghệ và phương pháp luận.
- **Chương 3 – Requirements Analysis:** stakeholder, yêu cầu chức năng/phi chức năng, yêu cầu giải pháp và kế hoạch/tiến độ.
- **Chương 4 – Design:** kiến trúc hệ thống, use case, sơ đồ lớp/miền, thiết kế cơ sở dữ liệu, sơ đồ hoạt động/tuần tự và wireframe.
- **Chương 5 – Implementation:** môi trường, cấu trúc mã nguồn, API, thuật toán, tích hợp ngoài, vấn đề kỹ thuật, build và triển khai.
- **Chương 6 – Evaluation:** kết quả, kế hoạch và nhật ký kiểm thử, trường hợp lỗi, đánh giá thuật toán và đối chiếu yêu cầu.
- **Chương 7 – Conclusion:** công việc hoàn thành, bài học, vấn đề/giải pháp, hướng phát triển và tự đánh giá.
- **Chương 8 – Appendices:** kế hoạch ban đầu và thay đổi, tài liệu bổ sung, tài liệu tham khảo.

# 2. Literature Review

## 2.1 Domain: Digital Manga and Novel Platforms

### Domain background

[Mô tả nền tảng nội dung số, vai trò Reader/Author/Publisher/Admin và quy trình đăng tải, duyệt, phân phối, kiếm tiền.]

### Origin of the project idea

[Ý tưởng đến từ đâu? Vấn đề nào được quan sát? Ai là người dùng mục tiêu?]

### Related work and research

[Tóm tắt bài báo, sách, tài liệu học thuật/kỹ thuật liên quan. Với mỗi nguồn: câu hỏi nghiên cứu, phương pháp, kết quả liên quan đến NovaManga.]

| Source | Main idea/result | Relevance to NovaManga | Limitation |
|---|---|---|---|
| [Nguồn 1] | [Tóm tắt] | [Liên quan] | [Giới hạn] |
| [Nguồn 2] | [Tóm tắt] | [Liên quan] | [Giới hạn] |

### Social, legal, ethical and professional issues

- **Bản quyền/nội dung dịch:** [Giấy phép, trách nhiệm Publisher, Fan Translation, quy trình xử lý vi phạm.]
- **Nội dung do người dùng đăng:** [Duyệt nội dung, report, khiếu nại.]
- **AI moderation:** [AI chỉ hỗ trợ sàng lọc; cách xử lý khi AI lỗi hoặc gắn cờ sai.]
- **Dữ liệu cá nhân và bảo mật:** [Dữ liệu thu thập, quyền truy cập, mật khẩu, token, secrets.]
- **Thanh toán:** [Đối soát, giao dịch lặp, minh bạch giá và doanh thu.]
- **Khả năng tiếp cận:** [Cỡ chữ, điều hướng, responsive, accessibility.]
- **Professional issues:** [Đạo đức nghiên cứu, trích dẫn, giấy phép thư viện, bảo vệ người dùng.]

## 2.2 Similar Applications

> Thay ví dụ eBay/Tiki bằng nền tảng cùng miền. Có thể nghiên cứu **Wattpad**, **WEBTOON**, **MangaToon** hoặc **Webnovel**; chọn hai ứng dụng mà bạn thực sự kiểm tra. Không khẳng định tính năng, bảo mật hay hiệu năng nếu không có bằng chứng.

### 2.2.1 Application 1: [Tên nền tảng]

- **Reason for selection:** [Tệp người dùng/loại nội dung tương đồng.]
- **Review method and evidence:** [Ngày, thiết bị/trình duyệt, URL, ảnh chụp/tài liệu.]
- **UI/UX:** [Điều hướng, đọc truyện, tìm kiếm, responsive, accessibility.]
- **Features:** [Tính năng quan sát được.]
- **Security/performance:** [Chỉ đánh giá phần đo/quan sát được; phân biệt quan sát với suy đoán.]
- **Advantages / disadvantages:** [Có bằng chứng.]
- **Lessons for NovaManga:** [Điều áp dụng/không áp dụng và lý do.]

### 2.2.2 Application 2: [Tên nền tảng]

[Lặp lại cấu trúc Application 1.]

### 2.2.3 Comparative Summary

| Aspect | Application 1 | Application 2 | NovaManga response |
|---|---|---|---|
| Discovery/search | [Bằng chứng] | [Bằng chứng] | [Thiết kế dự án] |
| Reading experience | [Bằng chứng] | [Bằng chứng] | [Thiết kế dự án] |
| Creator/publisher support | [Bằng chứng] | [Bằng chứng] | [Thiết kế dự án] |
| Monetization | [Bằng chứng] | [Bằng chứng] | [Thiết kế dự án] |
| Moderation/safety | [Bằng chứng] | [Bằng chứng] | [Thiết kế dự án] |

## 2.3 Technologies

Chỉ giữ công nghệ thực sự dùng trong phiên bản cuối.

| Technology | Role in NovaManga | Advantages | Disadvantages/risks | Reason for selection |
|---|---|---|---|---|
| React + TypeScript + Vite | Frontend web | [Điền] | [Điền] | [Điền] |
| NestJS + TypeScript | Backend API/modules | [Điền] | [Điền] | [Điền] |
| Prisma | ORM/data access | [Điền] | [Điền] | [Điền] |
| PostgreSQL | Relational database | [Điền] | [Điền] | [Điền] |
| DeepSeek API | AI assistant/moderation | [Điền] | Dịch vụ ngoài, quota/chi phí, kết quả có thể sai | [Điền] |
| SePay/VietQR | Bank deposit workflow | [Điền] | Phụ thuộc tích hợp ngoài | [Điền] |
| [Cloudinary/other verified service] | [Vai trò] | [Điền] | [Điền] | [Điền] |

### Architecture and technology choice

[Giải thích frontend/backend/API/database và các tích hợp ngoài kết nối thế nào. Nêu lựa chọn thay thế đã cân nhắc.]

## 2.4 Development Methodology

- **Methodology actually followed:** [Agile/Scrum, iterative development, Waterfall, hoặc cách làm thực tế.]
- **Overview:** [Mô tả.]
- **Advantages in this project:** [Điền.]
- **Disadvantages/limitations:** [Điền.]
- **Reason for selection:** [Dựa trên cách dự án thực sự được phát triển.]
- **Progress tracking:** [Backlog, milestones, issue board, commit history, meeting notes...]

# 3. Requirements Analysis

## 3.1 Stakeholders

| Stakeholder | Goals | Main interactions | Priority/concerns |
|---|---|---|---|
| Reader | [Khám phá, đọc, quản lý thư viện] | [Điền] | [Điền] |
| Author | [Đăng và quản lý nội dung] | [Điền] | [Điền] |
| Publisher | [Quản lý nội dung được cấp phép/doanh thu] | [Điền] | [Điền] |
| Admin/Moderator | [Duyệt, xử lý báo cáo, vận hành] | [Điền] | [Điền] |
| External services | [DeepSeek, SePay, storage...] | [Điền] | [Điền] |

## 3.2 Requirements from Similar-Application Review

[Nối từng phát hiện ở mục 2.2 với yêu cầu cụ thể. Không sao chép tính năng không phù hợp.]

## 3.3 Business and Functional Requirements

Gán ID, ưu tiên và tiêu chí nghiệm thu cho từng yêu cầu.

| ID | Requirement | Actor | Priority | Acceptance criteria |
|---|---|---|---|---|
| FR-01 | Người dùng đăng ký/đăng nhập theo quyền được cấp | Reader/Author/Publisher | [Must/Should/Could] | [Điều kiện kiểm thử được] |
| FR-02 | Author/Publisher tạo và quản lý Manga/Novel/chapter | Author/Publisher | | |
| FR-03 | Admin duyệt nội dung và quản lý báo cáo | Admin | | |
| FR-04 | Reader tìm kiếm/khám phá và đọc nội dung | Reader | | |
| FR-05 | Reader quản lý tiến độ, bookmark, favorite, rating | Reader | | |
| FR-06 | Hệ thống quản lý quyền đọc nội dung miễn phí/trả phí | Reader | | |
| FR-07 | Ví coin, nạp tiền, mua nội dung, ghi nhận giao dịch | Reader/Admin | | |
| FR-08 | Ghi nhận doanh thu creator và quy trình payout | Author/Publisher/Admin | | |
| FR-09 | Trợ lý AI tra cứu thông tin Novel | Reader | | |
| FR-10 | AI hỗ trợ sàng lọc nội dung cần kiểm duyệt | Admin/Author/Publisher | | |
| FR-11 | Bình luận, thông báo, report và ticket hỗ trợ | Reader/Admin | | |
| FR-12 | Lưu chapter/trang đọc gần nhất và khôi phục khi người dùng quay lại truyện | Reader | | Với tài khoản đăng nhập, mở lại truyện đưa người đọc về chapter/trang đã lưu; lưu vị trí không tự đánh dấu chapter là hoàn thành. |

[Xóa yêu cầu chưa triển khai; thêm yêu cầu quan trọng còn thiếu.]

## 3.4 Solution Requirements

- Frontend: [React/TypeScript/Vite, routing, data fetching, UI libraries thực tế.]
- Backend: [NestJS modules, REST API, validation/auth.]
- Data: [PostgreSQL/Prisma, migrations, backup/seed.]
- Integrations: [DeepSeek, payment webhook, media storage.]
- Architecture constraints: [Điều kiện triển khai/cấu hình môi trường.]

## 3.5 Non-Functional Requirements

Viết yêu cầu có thể kiểm tra; thay các giá trị trong ngoặc bằng mục tiêu phù hợp.

| ID | Category | Requirement/target | Verification method |
|---|---|---|---|
| NFR-01 | Performance | [p95 dưới X giây với Y users/dữ liệu thử nghiệm] | [Load test/tool/log] |
| NFR-02 | Security | Secrets không trả về API; endpoint quản trị cần auth/authorization | [Test/inspection] |
| NFR-03 | Reliability | Webhook/giao dịch lặp không cộng coin hoặc ghi doanh thu trùng | [Replay test] |
| NFR-04 | Usability | [Luồng hoàn thành trong X bước hoặc qua usability test] | [Test người dùng] |
| NFR-05 | Compatibility | [Trình duyệt/OS/device thực sự kiểm thử] | [Compatibility test] |
| NFR-06 | Accessibility | [Keyboard, contrast, labels...] | [Audit] |
| NFR-07 | Maintainability | [Module boundaries, type-check/build, documentation] | [Build/review] |

## 3.6 Project Requirements and Schedule

| Milestone/Sprint | Planned work | Actual dates | Deliverables | Status/variance |
|---|---|---|---|---|
| [M1/Sprint 1] | [Điền] | [Điền] | [Điền] | [Điền] |
| [M2/Sprint 2] | [Điền] | [Điền] | [Điền] | [Điền] |
| [M3/Sprint 3] | [Điền] | [Điền] | [Điền] | [Điền] |

[Nếu Agile: thêm Product Backlog, sprint goal, backlog và review. Nếu Waterfall: thêm WBS, milestone và baseline requirements. Chỉ mô tả cách đã thực sự dùng.]

# 4. Design

> Mỗi hình cần số thứ tự, caption, nguồn (nếu không tự vẽ) và đoạn giải thích mục đích, thành phần, luồng chính.

## 4.1 System Architecture

**Figure 4.1 — NovaManga system architecture:** [Browser/frontend → REST API/backend modules → PostgreSQL; thêm DeepSeek, payment/webhook và media storage nếu dùng.]

[Giải thích request flow, authentication, data access, tích hợp ngoài, ranh giới tin cậy và nơi lưu secrets.]

## 4.2 Use Case Diagram

**Figure 4.2 — Use cases by actor:** Reader, Author, Publisher, Admin.

[Giải thích use case cốt lõi. Bổ sung mô tả chi tiết cho đăng/duyệt nội dung, đọc nội dung trả phí, nạp coin/mua truyện và trợ lý AI.]

## 4.3 Class/Domain Diagram

**Figure 4.3 — Main domain classes/entities:** User, Content, Chapter, Publisher, Genre/Tag, ReadingProgress, Rating, Wallet, PaymentOrder, ContentPurchase, CreatorRevenue, AiChatSession/Message.

[Chỉ đưa entity/quan hệ quan trọng; giải thích cardinality và quy tắc miền.]

## 4.4 Database Design

**Figure 4.4 — ERD:** [Chèn ERD sinh từ schema/migration đã triển khai.]

[Giải thích khóa chính/ngoại, unique constraints, quan hệ quan trọng và cách tránh giao dịch trùng. Không cần mô tả mọi cột.]

## 4.5 Activity/Sequence Diagrams

Tạo sơ đồ cho các luồng chính:

1. [Author/Publisher đăng truyện → moderation/review → xuất bản.]
2. [Reader nạp coin → nhận webhook/đối soát → cập nhật ví.]
3. [Reader mua nội dung → kiểm tra quyền truy cập chapter.]
4. [Reader hỏi AI → provider/tools → DeepSeek → lưu câu trả lời.]

[Với mỗi sơ đồ: giải thích điều kiện, nhánh lỗi và dữ liệu được cập nhật.]

## 4.6 Wireframes and UI Design

[Chèn wireframe hoặc ảnh màn hình cho trang khám phá, đọc truyện, creator dashboard, admin review và AI assistant. Nêu lý do thiết kế và responsive behavior.]

# 5. Implementation

## 5.1 Development Environment and Tools

- OS/runtime: [Phiên bản thực tế.]
- Frontend: React, TypeScript, Vite, [các thư viện thực dùng].
- Backend: NestJS, TypeScript, Prisma.
- Database/services: PostgreSQL, [DeepSeek, SePay, media storage...].
- Version control/testing tools: [Điền.]

## 5.2 Code Structure

[Chèn cây thư mục rút gọn. Giải thích Frontend `features/` và Backend `modules/`; mô tả Controller → Service → Prisma/database bằng một ví dụ.]

## 5.3 Key Components and API Flow

| Flow | Frontend entry | Backend endpoint/service | Data/integration |
|---|---|---|---|
| Content discovery | [Điền] | [Content controller/discovery service] | PostgreSQL |
| Reading/access | [Điền] | [Novel/Manga/unlock services] | Content/chapter/purchase |
| Payment | [Điền] | [Payment/webhook/reconciliation] | SePay, wallet, ledger |
| AI assistant | [Điền] | [AI controller/chat/provider/tools] | DeepSeek |
| Moderation | [Điền] | [Moderation/workflow] | DeepSeek/Admin review |

## 5.4 Important Algorithms

Chỉ mô tả công thức hiện tại trong code; ghi trọng số/giả định và lý do chọn.

- **Popularity ranking:** lượt đọc gần đây, favorites, bookmarks, rating trong cửa sổ [7 ngày]; giải thích chuẩn hóa và trọng số trong `getRankedContents()`.
- **Personalized recommendation:** genre/tag interests, suy giảm trọng số theo thời gian, popularity, freshness và rating trong `getRecommendations()`.
- **Bayesian rating:** điểm đánh giá được làm mượt bằng trung bình chung và prior count [5]; phân biệt điểm xếp hạng với rating hiển thị.
- **Recommendation diversification:** relevance/diversity weights [80/20], độ giống genre/tag và candidate pool [100].
- **Similar content:** overlap genre/tag và trọng số [60/40].
- **Other algorithms:** [phân trang văn bản, quota, kiểm tra idempotency giao dịch...]

[Nêu rõ đây là heuristic/rule-based nếu chưa huấn luyện mô hình ML. Đánh giá Big-O chỉ khi giải thích đầu vào và giới hạn ứng viên.]

## 5.5 Important APIs and Libraries

| API/library | Use | How it is integrated | Failure/limitation handling |
|---|---|---|---|
| DeepSeek API | [Assistant/moderation] | [Request/response flow] | [Retry, timeout/unavailable behavior] |
| SePay webhook | [Bank deposits] | [Validation, match, apply] | [Duplicate/review/wrong-account handling] |
| Prisma | [Database access] | [Models, transactions, migrations] | [Constraint/error handling] |
| [Other] | [Use] | [How] | [Limits] |

## 5.6 Technical Problems and Solutions

| Problem | Root cause | Solution | Evidence/result |
|---|---|---|---|
| [Problem 1] | [Cause] | [Fix] | [Test/log/screenshot] |
| [Problem 2] | [Cause] | [Fix] | [Test/log/screenshot] |

## 5.7 Build and Deployment

[Prerequisites, environment variables by name only (never secrets), database migrations, build/start commands, deployment topology, backup/monitoring and known limitations.]

## 5.8 Development Plan: Actual Work

[Trình bày sprint/milestone đã làm, deliverable thực tế, thay đổi so với kế hoạch và lý do. Không ghi kế hoạch dự kiến như thể đã hoàn thành.]

# 6. Evaluation

## 6.1 Results

[Ảnh chụp tính năng quan trọng, mỗi ảnh có caption, vai trò sử dụng và kết quả mong đợi/thực tế.]

## 6.2 Test Plan

| Test ID | Requirement | Scenario/preconditions | Steps | Expected result | Actual result | Pass/fail |
|---|---|---|---|---|---|---|
| T-01 | FR-01 | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |
| T-02 | FR-06 | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |
| T-03 | NFR-03 | Gửi lại cùng webhook transaction ID | [Điền] | Không cộng coin lần hai | [Điền] | [Điền] |
| T-04 | FR-09 | DeepSeek không khả dụng | [Điền] | Lỗi được xử lý rõ ràng | [Điền] | [Điền] |

## 6.3 Test Logs and Results

- Môi trường và phiên bản: [Điền.]
- Lệnh đã chạy: [Điền.]
- Tổng số test/pass/fail: [Chỉ ghi số đo được.]
- Log/ảnh/báo cáo: [Dẫn chiếu phụ lục hoặc artifact.]

## 6.4 Failed Cases and Limitations

[Mô tả lỗi thật đã gặp, nguyên nhân, cách xử lý/chưa xử lý và tác động.]

## 6.5 Algorithm Evaluation

[Tạo tập dữ liệu/ground truth; so sánh baseline và phiên bản mới. Có thể dùng Precision@K, Recall@K, coverage, diversity hoặc đánh giá người dùng. Nêu cách lấy dữ liệu, công thức chỉ số, kết quả đo và giới hạn. Nếu chưa đo thì ghi rõ, không kết luận thuật toán tốt hơn chỉ dựa trên cảm nhận.]

## 6.6 Requirements Traceability

| Requirement ID | Design section | Implementation | Test ID | Status |
|---|---|---|---|---|
| FR-01 | [Điền] | [Điền] | [Điền] | [Điền] |

# 7. Conclusion

## 7.1 Work Completed

[Tóm tắt mục tiêu đạt được bằng dẫn chiếu đến yêu cầu/test.]

## 7.2 Lessons Learned

[Kỹ thuật, làm việc nhóm/quản lý thời gian, nghiên cứu, tích hợp dịch vụ.]

## 7.3 Problems and Solutions

[Tóm tắt các vấn đề lớn và cách giải quyết.]

## 7.4 Future Work

[Ưu tiên: đánh giá gợi ý bằng dữ liệu; tối ưu truy vấn khi dữ liệu tăng; accessibility; monitoring; mobile nếu cần. Phân biệt đề xuất với tính năng đã hoàn thành.]

## 7.5 Self-Evaluation

[Đánh giá mục tiêu, chất lượng, công nghệ, phương pháp, giới hạn và bằng chứng. Nêu điểm chưa đạt, không chỉ liệt kê thành công.]

# 8. Appendices

## 8.1 Proposal Plan and Changes

[Tóm tắt kế hoạch gốc và những thay đổi quan trọng, giải thích lý do và ảnh hưởng. Không chép nguyên proposal vào đây.]

## 8.2 Additional Materials

- [API examples/OpenAPI excerpts đã làm sạch thông tin nhạy cảm.]
- [Test logs, test data schema, screenshots bổ sung.]
- [Hướng dẫn cài đặt/chạy ứng dụng.]
- [Bảng phân công công việc nếu làm nhóm.]

## References

[Danh sách nguồn theo chuẩn trường yêu cầu (IEEE/Harvard/APA). Mọi số liệu, hình ảnh, khẳng định từ ứng dụng/tài liệu ngoài và ý tưởng học thuật đều cần trích dẫn. Ghi ngày truy cập với nguồn web.]
