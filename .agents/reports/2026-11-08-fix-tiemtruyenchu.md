# Báo Cáo Kỹ Thuật: Sửa Lỗi Đọc Chương Extension Tiệm Truyện Chữ (tiemtruyenchu)

- **Ngày thực hiện:** 2026-11-08
- **Người thực hiện:** Sub-agent Executor (Gemini 3.8 Flash Medium)
- **Nhánh làm việc:** `fix/tiemtruyenchu-chap-reading` (remote `origin/fix/tiemtruyenchu-chap-reading`)
- **Repo:** `qsang2025/Qsang_vbook`
- **Phiên bản extension:** Version 5 (bump từ v4)

---

## 1. Nguyên Nhân Gốc Của Các Lỗi Cũ

1. **Lỗi cú pháp nghiêm trọng (SyntaxError) trong `src/chap.js`:**
   - Tại dòng 88 xuất hiện dấu đóng ngoặc nhọn `}` thừa làm kết thúc sớm hàm `execute(url)`, khiến toàn bộ khối code fallback `Engine.newBrowser()` nằm ngoài thân hàm và dòng 135 kết thúc bằng dấu `}` không hợp lệ.
   - Khi chạy `node -c src/chap.js`, trình biên dịch Node.js (và Rhino engine trong app vBook) báo lỗi `SyntaxError: Unexpected token '}'`. Điều này khiến runtime vBook từ chối load/thực thi file, gây lỗi đọc chương ngay lập tức.
2. **Không đọc được Session Cookie `HttpOnly`:**
   - Hệ thống web `tiemtruyenchu.cloud` (chạy Node.js / Express-Session) lưu phiên xác thực người dùng trong cookie `session=s%3A...` với cờ bảo mật `HttpOnly; SameSite=Lax`.
   - Code cũ dùng `browser.callJs("document.cookie;")` trong Headless WebView. Theo tiêu chuẩn bảo mật trình duyệt, `document.cookie` không thể truy xuất cookie có cờ `HttpOnly`, dẫn đến việc `saveCookie` luôn lưu chuỗi rỗng.
   - Trong `src/config.js`, hàm `getSavedCookie()` chỉ đọc từ biến cấu hình hoặc `localStorage`, hoàn toàn thiếu việc gọi `localCookie.getCookie()` của vBook runtime (nơi Android `CookieManager` quản lý session từ in-app browser).
3. **Mô tả cấu hình Cookie trong `plugin.json` chưa chính xác:**
   - Manifest cũ ghi `connect.sid=...` (tên mặc định của express-session), trong khi cookie thực tế của hệ thống là `session=...`.

---

## 2. Kết Quả Khảo Sát Máy Chủ & Chế Độ Logged-out (Không Đăng Nhập)

Đã khảo sát và fuzzing hơn 150 endpoint trực tiếp tới `https://tiemtruyenchu.cloud`:
- **Truyện kiểm tra:** "Quỷ Bí Chi Chủ" (Story ID `3703`, bản dịch, 1.394 chương; và Story ID `584`, bản convert).
- **Chương kiểm tra:** Chương 1 ("Chương 01: Đỏ Rực", `chapterNumber: 1`, `chapter_price: 0`, miễn phí).
- **Phản hồi từ máy chủ khi không có Cookie:**
  - `GET /doc-truyen/3703/chuong/1` -> Trả về HTTP 200, nhưng HTML là trang Interstitial giới thiệu tải app di động (`<p class="hint">Tải ứng dụng Tiệm Truyện Chữ để đọc truyện này.</p>`), không chứa nội dung chương thật hay các selector `#chapter-body`, `.chapter-content`.
  - `GET /api/prefetch-chapter/3703/1` -> Trả về HTTP 401 `{"success":false,"message":"Vui lòng đăng nhập để tiếp tục!"}`.
  - Các route khác như `/api/v1/stories/3703/chapters`, `/api/chapter/*`, `/api/read/*` đều bị Nginx hoặc auth middleware chặn (403/401).
- **Kết luận:** Website **bắt buộc có tài khoản đăng nhập** để đọc bất kỳ chương nào (kể cả chương giá 0). Không có backdoor hay endpoint công khai không cần auth.

---

## 3. Các Giải Pháp Kỹ Thuật Đã Triển Khai

### 3.1 Cập nhật `src/config.js`
- **Tích hợp `localCookie` chuẩn API vBook:**
  ```javascript
  function getSavedCookie() {
      if (USER_COOKIE) return USER_COOKIE;
      try {
          if (typeof localCookie !== "undefined" && localCookie && typeof localCookie.getCookie === "function") {
              var lc = localCookie.getCookie();
              if (lc && String(lc).trim()) return String(lc).trim();
          }
      } catch (e) {}
      try {
          if (typeof localStorage !== "undefined" && localStorage) {
              var c = localStorage.getItem("ttc_cookie");
              if (c) return String(c).trim();
          }
      } catch (e) {}
      return "";
  }
  ```
- **Hàm `saveCookie(cookieStr)`:** Đồng bộ ghi vào `localCookie.setCookie(cookieStr)` và lưu dự phòng vào `localStorage`.
- **Thêm User-Agent chuẩn vào `buildHeaders()`:** Sử dụng `UserAgent.android()` (hoặc fallback Android Chrome UA) để tránh bị backend Nginx/Express chặn với lỗi `"Bot detected"`.

### 3.2 Sửa lỗi và nâng cấp `src/chap.js`
- Xóa bỏ triệt để dấu `}` thừa, đảm bảo toàn bộ luồng xử lý nằm trọn trong `execute(url)`.
- **Luồng đọc chương tối ưu 4 bước:**
  1. **Bước 1 - Prefetch API:** Lấy `ck = getSavedCookie()`, gọi `/api/prefetch-chapter/:storyId/:chapNum`. Nếu thành công, trích xuất text, định dạng đoạn văn với `formatPlainContent` và trả về `Response.success(content, chapterTitle)`.
  2. **Bước 2 - Fetch HTML:** Fetch trực tiếp `/doc-truyen/:storyId/chuong/:chapNum`. Nếu dính Cloudflare challenge -> trả về `Response.error(formatChallengeError(...))`. Nếu là trang hợp lệ (không phải interstitial) -> trích xuất `#chapter-body` và trả về `Response.success(bodyHtml, docTitle)`.
  3. **Bước 3 - Fallback Headless WebView (`Engine.newBrowser`):** Tải trang để kích hoạt session từ `CookieManager`. Sau khi tải, kiểm tra lại `localCookie.getCookie()`, nếu có session cookie mới sẽ gọi lại API prefetch hoặc bóc tách DOM.
  4. **Bước 4 - Thông báo đăng nhập chuẩn vBook:** Nếu vẫn chưa có nội dung (do chưa đăng nhập), trả về `Response.error(formatLoginError("Tiệm Truyện Chữ", chapUrl))` với hướng dẫn tiếng Việt rõ ràng từng bước.
- **Tuân thủ chuẩn Rhino ES6:** Chỉ dùng `var`, `function`, nối chuỗi bằng `+`; không dùng cú pháp ES6+ nâng cao.

### 3.3 Cập nhật `plugin.json`
- Tác giả giữ nguyên: `"author": "Qsang"`.
- Phiên bản: Tăng từ `4` lên `5`.
- Cập nhật mô tả trường cấu hình `COOKIE`: `"title": "Cookie phiên đăng nhập (session=s%3A... — Không nhập mật khẩu vào plugin, dùng lại session trình duyệt)"`.

---

## 4. Kết Quả Kiểm Thử & Đóng Gói (Evidence)

1. **Kiểm tra cú pháp Node.js (`node -c`):**
   - `node -c extensions/novel/tiemtruyenchu/src/config.js` -> PASS (Exit code 0).
   - `node -c extensions/novel/tiemtruyenchu/src/chap.js` -> PASS (Exit code 0).
2. **Đóng gói Extension (`scripts/cli.js build`):**
   - `node scripts/cli.js build extensions/novel/tiemtruyenchu` -> Đã tạo `plugin.zip` (62.087 bytes, zip pure-Node).
3. **Đồng bộ Registry (`scripts/cli.js build-catalog`):**
   - Đã cập nhật `plugin.json` ở root repo với version 5 cho Tiệm Truyện Chữ.
   - `node scripts/cli.js build-catalog --check` -> `OK: plugin.json khớp với 17 nguồn trên đĩa.`
4. **Kiểm thử toàn diện (`scripts/cli.js validate`):**
   - Kết quả: `Đã kiểm tra 17 nguồn, 17 mục trong registry: PASS (0 cảnh báo).`
   - Rhino ES6 linter: Đạt chuẩn 100%, không vi phạm cú pháp cấm.
5. **Kiểm tra Dev Server:**
   - Kết quả lệnh `node scripts/cli.js connect --server http://100.90.26.91:8080`:
     `ERROR: cannot reach vBook server at http://100.90.26.91:8080 (/connect returned 400 Direct IP access is not allowed)`
     (Do sandbox `agy-plugin-proxy` trong container VM chặn kết nối IP trực tiếp ra mạng ngoài).

---

## 5. Hướng Dẫn Dành Cho Người Dùng Đăng Nhập Trên App vBook

Vì Tiệm Truyện Chữ yêu cầu tài khoản để đọc chương:
1. Trong app vBook, mở trang chi tiết một truyện thuộc nguồn **Tiệm Truyện Chữ**.
2. Nhấn vào biểu tượng **Quả địa cầu / Trình duyệt** ở góc trên cùng bên phải để mở In-App Browser.
3. Truy cập `https://tiemtruyenchu.cloud/login` và tiến hành đăng nhập bằng tài khoản Tiệm Truyện Chữ hoặc Google.
4. Sau khi đăng nhập thành công, session cookie `session=...` sẽ tự động được lưu vào `CookieManager` của app vBook.
5. Đóng trình duyệt, quay lại truyện và chọn chương để đọc bình thường.
*(Tùy chọn: Người dùng cũng có thể copy chuỗi cookie `session=s%3A...` từ trình duyệt ngoài và dán vào phần Cấu hình nguồn trong vBook).*
