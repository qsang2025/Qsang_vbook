# Đặc Tả Yêu Cầu: Sửa Lỗi Đọc Chương Extension Tiệm Truyện Chữ (tiemtruyenchu)

- **Ngày ghi nhận:** 2026-11-08
- **Tác vụ:** Sửa lỗi extension vBook `tiemtruyenchu` để người dùng có thể đọc được nội dung chương.
- **Thư mục extension:** `extensions/novel/tiemtruyenchu/`
- **Nhánh làm việc:** `fix/tiemtruyenchu-chap-reading` (tách từ `origin/main`)

---

## 1. Bối Cảnh & Vấn Đề (Problem Statement)

Người dùng báo cáo extension **Tiệm Truyện Chữ** (`tiemtruyenchu.cloud`) không đọc được nội dung chương trên ứng dụng vBook. Khi mở bất kỳ chương nào, extension bị lỗi hoặc không hiển thị được nội dung đọc.

### Các ca lỗi cụ thể (Failing Cases):
1. **Lỗi cú pháp (Fatal SyntaxError) trong `chap.js`:**
   - Khi chạy kiểm tra cú pháp bằng Node.js (`node -c extensions/novel/tiemtruyenchu/src/chap.js`):
     ```
     SyntaxError: Unexpected token '}' at line 135
     ```
   - Nguyên nhân: Có một dấu đóng ngoặc nhọn `}` thừa tại dòng 88 làm kết thúc sớm hàm `execute(url)`, khiến toàn bộ khối code fallback browser phía sau bị đẩy ra ngoài hàm, dẫn đến runtime Rhino của vBook không thể biên dịch script `chap.js`.
2. **Không đọc được session cookie đăng nhập:**
   - `tiemtruyenchu.cloud` dùng cookie phiên `session=s%3A...` với cờ `HttpOnly; SameSite=Lax`.
   - `chap.js` hiện tại dùng `browser.callJs("document.cookie;", 1000)` để thu thập cookie. Tuy nhiên, thuộc tính `HttpOnly` ngăn chặn hoàn toàn JavaScript trong trang đọc cookie này, khiến `document.cookie` luôn trả về rỗng `""`.
   - `config.js` (`getSavedCookie`) chỉ đọc từ `USER_COOKIE` (cấu hình người dùng) và `localStorage`, hoàn toàn bỏ sót API chuẩn của runtime vBook là `localCookie.getCookie()`. Do đó, dù người dùng đã đăng nhập thành công qua trình duyệt in-app của vBook, script vẫn không nhận được cookie.
3. **Trang web trả về Interstitial App-Download khi chưa đăng nhập:**
   - Khi truy cập `/doc-truyen/<storyId>/chuong/<chapNum>` không có cookie phiên đăng nhập, website trả về trang interstitial chứa thông điệp: *"Tải ứng dụng Tiệm Truyện Chữ để đọc truyện này"* kèm link deep-link `tiemtruyenchu://...` và link Google Play / App Store, hoàn toàn không có nội dung chương HTML.
   - Endpoint API `/api/prefetch-chapter/<storyId>/<chapNum>` trả về HTTP 401 `{"success":false,"message":"Vui lòng đăng nhập để tiếp tục!"}`.
4. **Nhãn cấu hình gây nhầm lẫn:**
   - Trong `plugin.json`, nhãn cấu hình cookie ghi: `"Cookie phiên đăng nhập (connect.sid=...)"`. Trong khi đó, tên cookie thật sự của backend Express trên `tiemtruyenchu.cloud` là `session=...`.

---

## 2. Các Sự Thật Đã Được Xác Minh (Verified Facts)

1. **Website và Truyện mẫu:**
   - Website chính thức: `https://tiemtruyenchu.cloud`.
   - Truyện mẫu khảo sát: "Quỷ Bí Chi Chủ" (ID 3703 - bản dịch, ID 584 - bản cv), tác giả Ái Tiềm Thủy Đích Ô Tặc.
   - API v1 `https://tiemtruyenchu.cloud/api/v1/stories/3703` hoạt động bình thường, trả về 1.394 chương.
   - Chương 1 (`{"chapterNumber":1,"title":"Chương 01: Đỏ Rực","chapter_price":0}`): dù có giá chương 0 xu (chương miễn phí), hệ thống backend vẫn yêu cầu đăng nhập tài khoản mới được truy cập nội dung.
2. **Cơ chế xác thực của website:**
   - Backend chạy Node.js / Express phía sau Nginx 1.24.0.
   - Cookie phiên: `session=s%3A...` (signed express-session cookie, `HttpOnly`, `SameSite=Lax`, hết hạn sau 30 ngày).
   - Đăng nhập hỗ trợ tài khoản mật khẩu (POST `/login` kèm username/password, có rate-limit 10 request / 15 phút) và đăng nhập bằng Google OAuth.
3. **Cơ chế đọc chương của website:**
   - Khi có phiên đăng nhập hợp lệ: API `/api/prefetch-chapter/:storyId/:chapNum` trả về JSON chứa nội dung chương dạng text plain.
   - Khi chưa đăng nhập: Mọi route `/api/*` (ngoài public API v1 stories) đều trả về 401 Unauthorized.
   - Route `/api/v1/stories/:id/chapters/:num` bị chặn ở cấp Nginx với mã 403 Forbidden.
4. **Cơ chế Cookie trong vBook Extension Engine:**
   - `localCookie.getCookie()`: Đọc cookie từ `CookieManager` của app vBook (chia sẻ chung với in-app browser và `Engine.newBrowser()`), lấy được cả cookie có cờ `HttpOnly`.
   - `localCookie.setCookie("session=...; domain=tiemtruyenchu.cloud; path=/")`: Ghi cookie vào cookie jar của app.
   - Khi người dùng bấm biểu tượng Trình duyệt trên app vBook và đăng nhập vào `https://tiemtruyenchu.cloud/login`, `CookieManager` sẽ lưu cookie `session`. Script chỉ cần gọi `localCookie.getCookie()` là tự động có cookie này.
5. **Trạng thái Dev Server vBook:**
   - IP `100.90.26.91:8080` hiện không thể kết nối từ sandbox VM (proxy chặn direct IP access, direct connection timeout, dev server offline). Việc kiểm thử phải dựa trên kiểm tra cú pháp Node.js, linter repo `cli.js validate`, và kiểm tra logic luồng xử lý.

---

## 3. Mục Tiêu Cần Đạt (Acceptance Criteria)

1. **Khắc phục triệt để lỗi cú pháp trong `chap.js`:**
   - Sửa cấu trúc ngoặc nhọn, đảm bảo `node -c extensions/novel/tiemtruyenchu/src/chap.js` thoát mã 0.
2. **Tích hợp `localCookie.getCookie()` vào `config.js`:**
   - `getSavedCookie()` phải ưu tiên đọc từ:
     1. Biến cấu hình `USER_COOKIE` (nếu người dùng cấu hình tay trong vBook).
     2. `localCookie.getCookie()` từ hệ thống vBook `CookieManager`.
     3. `localStorage.getItem("ttc_cookie")` làm dự phòng.
3. **Chuẩn hóa thu thập cookie trong `chap.js`:**
   - Khi fallback qua `Engine.newBrowser()`, không dựa vào `document.cookie` (vốn vô tác dụng với `HttpOnly`), mà sau khi `browser.launch()` thành công thì lấy cookie qua `localCookie.getCookie()` hoặc để vBook tự đồng bộ cookie.
4. **Cập nhật `plugin.json`:**
   - Đổi hướng dẫn cấu hình cookie từ `connect.sid=...` thành `session=...`.
   - Bump version extension theo đúng quy tắc repo (từ version 4 lên version 5).
5. **Cập nhật Golden Fixture & Health Check:**
   - Đồng bộ `test.json` và `health.json` nếu cần.
6. **Đảm bảo toàn bộ repo hợp lệ:**
   - `node scripts/cli.js validate` vượt qua 100%, không cảnh báo, catalog khớp đĩa, zip được build tự động qua CLI.
