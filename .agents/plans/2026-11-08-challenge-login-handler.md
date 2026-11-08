# Plan: Cơ chế xử lý Cloudflare challenge + trang yêu cầu đăng nhập kiểu Legado trong vBook

> **Ngày tạo:** 2026-11-08  
> **Nhánh:** `feature/challenge-login-popup` (tách từ `origin/main` c4575d1)  
> **Repo:** `qsang2025/Qsang_vbook`  
> **Trạng thái:** IN_PROGRESS  

---

## 1. Mục tiêu & Giới hạn kỹ thuật

### Giới hạn kỹ thuật (Hợp đồng `extension-api.md` đã kiểm chứng)
- vBook extension **không có API popup/mở trình duyệt tương tác trực tiếp cho người dùng**.
- API trình duyệt duy nhất là **Headless WebView** qua `Engine.newBrowser()` (chạy ngầm, không có UI hiển thị để người dùng giải CAPTCHA hoặc nhập form đăng nhập).
- Cơ chế Legado-style tối ưu trong giới hạn vBook:
  1. **Phát hiện**: Nhận diện Cloudflare challenge (`isChallengeText`, `isChallengeDoc`, header `cf-mitigated: challenge`) và trang yêu cầu đăng nhập (`login-required`).
  2. **Thử Headless WebView (`fetchViaBrowser`)**: Tận dụng kho cookie dùng chung giữa app vBook và WebView headless. Nếu người dùng đã từng vượt challenge hoặc đăng nhập trên in-app browser của vBook, headless browser có thể tận dụng session/cookie đó.
  3. **Thông báo lỗi hướng dẫn chi tiết tiếng Việt**: Nếu headless browser vẫn không qua được, trả về `Response.error(...)` nêu rõ tên website, lý do bị chặn, và hướng dẫn từng bước người dùng mở trình duyệt trong app vBook để đăng nhập / xác minh rồi quay lại bấm thử lại.

---

## 2. Kế hoạch triển khai chi tiết

### Bước 0: Commit file Plan lên nhánh `feature/challenge-login-popup`
- Commit file `.agents/plans/2026-11-08-challenge-login-handler.md`.

### Bước 1: Xây dựng thư viện dùng chung `lib/challenge-handler.js`
- Tạo file [lib/challenge-handler.js](file:///home/antigravity/qsang2025/Qsang_vbook/lib/challenge-handler.js).
- Header comment ghi rõ giới hạn kỹ thuật (không có API mở popup tương tác từ extension, giải pháp là phát hiện + headless WebView + hướng dẫn in-app browser).
- Tuân thủ **Rhino ES6**: `var`, `function`, không arrow function, không `?.`, không `??`, không template literals, không `load()` đệ quy.
- Cung cấp các hàm utility:
  - `isCloudflareChallenge(html, headers)`: kiểm tra dấu hiệu Cloudflare ("Just a moment...", `cf-turnstile`, `challenges.cloudflare.com`, `cf-mitigated: challenge`).
  - `isLoginRequired(html, url)`: kiểm tra dấu hiệu trang đăng nhập (chuỗi tiếng Việt / tiếng Trung / tiếng Anh: "Vui lòng đăng nhập", "Chương VIP yêu cầu đăng nhập", "请先登录", "Sign in to continue").
  - `fetchWithChallengeHandler(url, options)`: Thử fetch thông thường qua `Http.get`. Nếu phát hiện challenge/login, thử fallback qua `Engine.newBrowser()`.
  - `formatChallengeError(siteName, url)`: Tạo thông báo tiếng Việt từng bước vượt Cloudflare qua in-app browser vBook.
  - `formatLoginError(siteName, url)`: Tạo thông báo tiếng Việt từng bước đăng nhập qua in-app browser vBook.

### Bước 2: Tích hợp vào 5 extension trọng điểm
1. **`extensions/novel/sangtacviet/`**:
   - Tích hợp `challenge-handler.js` vào `detail.js`, `chap.js`, `toc.js`.
   - Đảm bảo `BASE_URL` mặc định là `https://sangtacviet.app` (khắc phục `sangtacviet.vip` không vào được).
   - Bump version: `3` -> `4` trong manifest `extensions/novel/sangtacviet/plugin.json`.
2. **`extensions/novel/lacatruyen/`**:
   - Tích hợp `challenge-handler.js` cho trường hợp phát hiện yêu cầu đăng nhập tài khoản.
   - Bump version: `1` -> `2` trong `extensions/novel/lacatruyen/plugin.json`.
3. **`extensions/novel/tiemtruyenchu/`**:
   - Tích hợp `challenge-handler.js` cho kiểm tra đăng nhập.
   - Bump version: `1` -> `2` trong `extensions/novel/tiemtruyenchu/plugin.json`.
4. **`extensions/novel/apptruyenchu/`**:
   - Tích hợp `challenge-handler.js` thay thế / chuẩn hóa phần `fetchViaBrowser` thủ công.
   - Bump version: `2` -> `3` trong `extensions/novel/apptruyenchu/plugin.json`.
5. **`extensions/novel/biquge/`**:
   - Tích hợp `challenge-handler.js` xử lý Cloudflare challenge.
   - Bump version: `1` -> `2` trong `extensions/novel/biquge/plugin.json`.

### Bước 3: Đóng gói và Inline thư viện (Build)
- Chạy lệnh build chuẩn cho từng extension:
  - `node scripts/cli.js build extensions/novel/sangtacviet`
  - `node scripts/cli.js build extensions/novel/lacatruyen`
  - `node scripts/cli.js build extensions/novel/tiemtruyenchu`
  - `node scripts/cli.js build extensions/novel/apptruyenchu`
  - `node scripts/cli.js build extensions/novel/biquge`
- Đảm bảo `lib/challenge-handler.js` được sao chép tự động vào `src/` của từng extension và `plugin.zip` được đóng gói chuẩn xác.

### Bước 4: Kiểm tra toàn vẹn & Cập nhật Registry
- Chạy `node scripts/cli.js build-catalog` để cập nhật `plugin.json` ở root.
- Chạy `node scripts/cli.js validate` (Rhino ES6 linter, catalog ≡ disk, version match, no orphan files).
- Chạy `node scripts/cli.js build-catalog --check` đảm bảo tính nhất quán.

### Bước 5: Commit & Push nhánh tính năng
- Commit toàn bộ thay đổi vào nhánh `feature/challenge-login-popup`.
- Push DUY NHẤT lên `origin feature/challenge-login-popup`.
- **TUYỆT ĐỐI KHÔNG push, merge hoặc rebase vào `main`**.

### Bước 6: Lập báo cáo kiểm thử & Báo cáo tổng kết
- Ghi nhận báo cáo vào `.agents/reports/2026-11-08-challenge-login-handler.md`.
- Ghi rõ danh sách extension đã tích hợp, cơ chế hoạt động, nội dung thông báo lỗi tiếng Việt, và hướng dẫn kiểm thử thực tế trên điện thoại.
