# Kế Hoạch: Sửa Lỗi Đọc Chương Extension Tiệm Truyện Chữ (tiemtruyenchu)

> **Ngày tạo:** 2026-11-08  
> **Nhánh làm việc:** `fix/tiemtruyenchu-chap-reading` (tách từ `origin/main`)  
> **Repo:** `qsang2025/Qsang_vbook`  
> **Trạng thái:** IN_PROGRESS  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

### Vấn đề cần khắc phục:
1. **Lỗi cú pháp (Fatal SyntaxError) trong `chap.js`:**
   - Dấu `}` thừa tại dòng 88 làm kết thúc sớm hàm `execute(url)`, khiến lệnh `node -c src/chap.js` lỗi `SyntaxError: Unexpected token '}'` tại dòng 135. Runtime Rhino của vBook không biên dịch được file này.
2. **Không đọc được session cookie `HttpOnly`:**
   - Website `tiemtruyenchu.cloud` dùng signed cookie `session=s%3A...` với thuộc tính `HttpOnly; SameSite=Lax`.
   - `chap.js` cũ dùng `browser.callJs("document.cookie;")` vốn không thể đọc được cookie `HttpOnly`, dẫn tới chuỗi cookie luôn rỗng.
   - `config.js` thiếu tích hợp API chuẩn `localCookie.getCookie()` của vBook runtime (nơi Android `CookieManager` lưu session từ in-app browser).
3. **Trang web bắt buộc đăng nhập (kể cả chương miễn phí `chapter_price: 0`):**
   - Đã khảo sát và xác minh trực tiếp: `/doc-truyen/:storyId/chuong/:chapNum` trả về trang Interstitial "Tải ứng dụng Tiệm Truyện Chữ", và `/api/prefetch-chapter/:storyId/:chapNum` trả về 401 Unauthorized khi chưa có cookie.
   - Không có API công khai nào cho phép đọc chương mà không có cookie đăng nhập.
4. **Hướng dẫn cấu hình chưa chuẩn xác:**
   - Trong `plugin.json`, mô tả cấu hình ghi `connect.sid=...` thay vì `session=...`.

---

## 2. Các Bước Thực Hiện Chi Tiết

### Bước 0: Commit file Plan lên nhánh `fix/tiemtruyenchu-chap-reading`
- File: `.agents/plans/2026-11-08-fix-tiemtruyenchu.md`.

### Bước 1: Sửa lỗi `src/config.js`
- Tích hợp `localCookie.getCookie()` vào `getSavedCookie()`:
  1. Ưu tiên 1: `USER_COOKIE` (cấu hình thủ công trong vBook nếu có).
  2. Ưu tiên 2: `localCookie.getCookie()` (lấy trực tiếp từ CookieManager của app vBook, đọc được cả `HttpOnly`).
  3. Ưu tiên 3: `localStorage.getItem("ttc_cookie")` (dự phòng).
- Cập nhật hàm `saveCookie(cookieStr)`:
  - Nếu `localCookie.setCookie` khả dụng, gọi để ghi vào cookie jar của app.
  - Lưu dự phòng vào `localStorage`.
- Đảm bảo `buildHeaders()` gửi `User-Agent` hợp lệ (dùng `UserAgent.android()` hoặc browser UA chuẩn) để tránh bị chặn "Bot detected".

### Bước 2: Sửa lỗi cú pháp và hoàn thiện logic trong `src/chap.js`
- Sửa triệt để lỗi cấu trúc ngoặc nhọn kết thúc hàm `execute(url)`.
- Luồng xử lý đọc chương:
  1. Trích xuất `storyId` và `chapNum` từ URL chương (hỗ trợ cả định dạng `/doc-truyen/:id/chuong/:num` và URL tương đối/tuyệt đối).
  2. Lấy cookie đăng nhập qua `getSavedCookie()`.
  3. Thử gọi API `/api/prefetch-chapter/:storyId/:chapNum` với cookie phiên.
     - Nếu nhận được JSON thành công: bóc tách text chương, làm sạch xuống dòng, trả về `Response.success(content, chapterTitle)`.
  4. Nếu API thất bại hoặc chưa có cookie, thử fetch HTML `/doc-truyen/:storyId/chuong/:chapNum`.
     - Kiểm tra nếu là Cloudflare Challenge: trả về `Response.error(formatChallengeError(...))`.
     - Kiểm tra nếu không phải Interstitial: bóc tách `#chapter-body`.
  5. Fallback qua Headless WebView (`Engine.newBrowser()`):
     - Tải trang để kích hoạt session từ CookieManager.
     - Sau khi tải, kiểm tra lại `localCookie.getCookie()`. Nếu thu được cookie mới, gọi lại API prefetch hoặc trích xuất DOM nếu trang render được nội dung.
  6. Nếu vẫn không lấy được nội dung (do chưa đăng nhập):
     - Trả về `Response.error(formatLoginError("Tiệm Truyện Chữ", chapUrl))` kèm các bước hướng dẫn cụ thể bằng tiếng Việt để người dùng mở trình duyệt vBook đăng nhập.
- Kiểm tra cú pháp bằng `node -c extensions/novel/tiemtruyenchu/src/chap.js` (phải PASS, exit code 0).

### Bước 3: Cập nhật `plugin.json`
- Đổi mô tả cấu hình cookie sang `session=...`.
- Tăng phiên bản extension (`version`): bump từ `4` lên `5`.
- Đảm bảo tác giả vẫn giữ nguyên chính xác: `"author": "Qsang"`.

### Bước 4: Đóng gói (Build) & Đồng bộ Registry
- Chạy lệnh build chuẩn:
  `node scripts/cli.js build extensions/novel/tiemtruyenchu`
- Chạy lệnh đồng bộ catalog:
  `node scripts/cli.js build-catalog`
- Chạy lệnh kiểm thử toàn diện:
  `node scripts/cli.js validate`
- Đảm bảo linter Rhino ES6 PASS 100%, catalog ≡ đĩa, version khớp, không có cảnh báo.

### Bước 5: Kiểm tra Dev Server & Ghi nhận kết quả
- Ghi nhận trạng thái kết nối Dev Server `100.90.26.91:8080`.
- Chạy đối soát golden fixture hoặc health check qua CLI.

### Bước 6: Commit & Push nhánh tính năng
- Commit toàn bộ thay đổi với commit message chuẩn mực:
  `fix(tiemtruyenchu): fix syntax error in chap.js and support HttpOnly session cookie via localCookie`
- Push DUY NHẤT lên `origin fix/tiemtruyenchu-chap-reading`.
- **TUYỆT ĐỐI KHÔNG push, merge hoặc rebase vào `main`**.

### Bước 7: Lập báo cáo tổng kết
- Tạo file báo cáo `.agents/reports/2026-11-08-fix-tiemtruyenchu.md`.
