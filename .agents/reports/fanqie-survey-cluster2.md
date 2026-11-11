# Báo Cáo Tiến Độ Sub-Agent (Flash) — Cụm 2: Khảo Sát Kỹ Thuật & Giải Pháp Fanqienovel.com

- **Mã công việc:** `2026-11-11-fanqie-survey`
- **Nhánh:** `research/fanqie-survey`
- **Trạng thái Cụm 2:** HOÀN THÀNH (DONE)
- **Các bước hoàn thành:**
  - **Step 3:** Phân tích `extension-api.md` về WebView/Browser, Cookie, LocalStorage và đánh giá 2 hướng: "WebView render lấy text" & "Người dùng tự đăng nhập".
  - **Step 4:** Khảo sát kiến trúc các dự án mã nguồn mở công khai (zwb8926, ying-ck, zhongbai2333, pattoneirc, Wildmess, fysh1010, Legado) về cách thức xử lý Fanqie.
  - **Step 5:** Đánh giá Kế hoạch B (Plan B) — Các nguồn hợp lệ thay thế sẵn có trong repo vBook và khả năng phủ sóng nội dung.

---

## 1. Các Việc Đã Thực Hiện
1. **Phân tích kỹ lưỡng hợp đồng vBook (`extension-api.md`):**
   - Đọc và đối chiếu các phần liên quan đến `Engine.newBrowser()`, `launch()`, `waitUrl()`, `callJs()`, `localCookie`, `localStorage`, và cấu trúc `chap.js`.
   - Kết luận chi tiết tại `work/ext-review/fanqie-cluster2-notes.md`.
2. **Khảo sát tài liệu công khai các repo mã nguồn mở:**
   - Tra cứu và tổng hợp tài liệu của 7 dự án lớn liên quan đến Fanqie trên GitHub và Open VSX Registry.
   - Nhận diện bản chất cơ chế của cộng đồng: hầu hết các dự án đọc được toàn văn truyện Fanqie hiện nay đều phụ thuộc vào một server trung gian chia sẻ (`101.35.133.34:5000`) hoặc dùng bảng charset tĩnh cố định dễ gãy.
3. **Phân tích Plan B — Nguồn thay thế trong kho vBook:**
   - Đối chiếu danh mục các extension hiện có (`69shuba`/`shuhaige`, `biquge`, `qimao`, `czbooks`).
   - Đánh giá khả năng tìm kiếm và đọc các truyện nổi tiếng xuất thân từ Fanqie.
4. **Ghi chép kết quả:**
   - Toàn bộ ghi chép chi tiết được lưu trữ tại `work/ext-review/fanqie-cluster2-notes.md`.

---

## 2. Các Phát Hiện Trọng Yếu Của Cụm 2

### 2.1. Phát Hiện Về Năng Lực vBook & Trình Đọc (Step 3)
1. **`Engine.newBrowser()` là Headless WebView:**
   - Không có giao diện tương tác người dùng. Khi gặp slide captcha `bdturing`, webview chạy ngầm không thể tự vượt qua và người dùng cũng không thể kéo trượt bằng tay trong chế độ này.
2. **Bản chất Font PUA trong DOM:**
   - Font mapping động của Fanqie chỉ thay đổi cách vẽ glyph trên màn hình; chuỗi ký tự thô trong DOM (`innerText`, `textContent`) vẫn là ký tự Unicode PUA (`U+E000`–`U+F8FF`). Do đó, lấy text qua WebView mà không giải mã font vẫn cho ra chuỗi ký tự rác (~60% chữ Hán bị mã hóa).
3. **Trình đọc vBook không nạp Web Font ngoài:**
   - Trình đọc `novel` của vBook render nội dung dạng text native định dạng HTML cơ bản. Nó không hỗ trợ nạp `@font-face` từ URL ngoài CDN của ByteDance. Nếu đẩy nguyên chuỗi HTML chứa ký tự PUA, văn bản sẽ lỗi font, và quan trọng hơn là **làm hỏng hoàn toàn các tính năng cốt lõi của vBook** (VietPhrase, AI Translate, Text-To-Speech, tra từ điển).
4. **Vấn đề Đăng nhập Người dùng:**
   - Dù người dùng có tự đăng nhập bằng tay trong trình duyệt của máy, trên web Fanqie tài khoản đã đăng nhập vẫn bị khóa chương và bắt buộc phải dùng app di động hoặc giải captcha.

### 2.2. Phát Hiện Từ Các Dự Án Mã Nguồn Mở (Step 4)
1. **Server chuyển tiếp bên thứ 3 (`101.35.133.34:5000`):**
   - Các extension như `zwb8926/fanqie-novel` (VS Code), `ying-ck/fanqienovel-downloader`, `fysh1010/mcp-server-fanqie` đều dựa vào một server trung gian do cộng đồng dựng. Server này chạy Unidbg/app device pool để cào văn bản đã giải mã. Đây là server lậu, không có domain, chỉ chạy HTTP, latency cao (3–20s) và có nguy cơ chết bất cứ lúc nào (dự án `fysh1010` bản mới đã phải từ bỏ server này).
2. **Bảng mã ký tự tĩnh (Static Charset Table):**
   - `ying-ck` và `Wildmess` giải mã font PUA bằng bảng tra JSON tĩnh (`assets/charset.json`). Cơ chế này có nhược điểm chí mạng: Mỗi khi ByteDance thay đổi hash font hoặc xoay bảng mã, toàn bộ việc đọc bị lỗi ("□") và phải cập nhật lại bảng mã thủ công.
3. **Cơ chế bdturing trên Datacenter IP:**
   - Các dự án đều xác nhận API chính thức `/api/reader/full` bị kích hoạt bdturing 100% trên mọi dải IP máy chủ / datacenter.

### 2.3. Đánh Giá Plan B — Nguồn Thay Thế (Step 5)
1. **Truyện Fanqie được cào lại đầy đủ trên các trang tổng hợp:**
   - Các tác phẩm nổi tiếng nhất của Fanqie (Trảm Thần, Thập Nhật Chung Yên, Ngã Bất Thị Hí Thần...) đều được các nền tảng aggregator như 69 Thư Ba, Bút Thú Các, Thư Hải Các cào về và chuẩn hóa thành UTF-8 sạch.
2. **Khuyến nghị cho vBook:**
   - Sử dụng các extension sẵn có trong repo (`biquge`, `shuhaige`, `czbooks`) để đọc toàn văn truyện Fanqie là phương án tối ưu, an toàn, ổn định và tương thích 100% với hệ thống dịch thuật/TTS của vBook.

---

## 3. Chuẩn Bị Cho Cụm 3 (Báo Cáo Tổng Hợp Toàn Diện)
Đã thu thập đầy đủ luận cứ và số liệu thực tế từ Cụm 1 và Cụm 2 để Master/Sub-agent hoàn thiện tài liệu báo cáo chính thức `work/ext-review/FANQIE-SURVEY-AG.md`:
- Hệ thống hóa 9 hướng giải pháp (H1–H9) kèm ma trận chấm điểm, phân tích ưu/nhược, tính khả thi trong Rhino ES6, và khuyến nghị cuối cùng cho anh Sáng.
