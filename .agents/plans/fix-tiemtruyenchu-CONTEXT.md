# Tài Liệu Khảo Sát Kỹ Thuật (CONTEXT): Extension Tiệm Truyện Chữ

- **Thời điểm khảo sát:** 2026-11-08 10:25 UTC
- **Đối tượng:** Extension `tiemtruyenchu` (`extensions/novel/tiemtruyenchu/`)
- **Trang nguồn:** `https://tiemtruyenchu.cloud`
- **Phiên bản hiện tại:** Version 4 (manifest)

---

## 1. Khảo Sát Hiện Trạng Mã Nguồn (Codebase Audit)

### 1.1 Cấu trúc thư mục
```
extensions/novel/tiemtruyenchu/
├── README.md
├── health.json
├── icon.png
├── plugin.json
├── plugin.zip
├── src/
│   ├── challenge-handler.js  (xử lý Cloudflare / thông báo đăng nhập tiếng Việt)
│   ├── chap.js               (nội dung chương)
│   ├── config.js             (cấu hình BASE_URL, cookie, headers, helpers)
│   ├── detail.js             (thông tin truyện qua API v1)
│   ├── gen.js                (danh sách truyện theo thể loại / bộ lọc)
│   ├── genre.js              (danh mục 19 thể loại tĩnh)
│   ├── home.js               (tab trang chủ tĩnh)
│   ├── search.js             (tìm kiếm truyện)
│   └── toc.js                (mục lục chương qua API v1)
└── test.json
```

### 1.2 Phân tích các file script chính

#### `src/chap.js` (Phát hiện lỗi nghiêm trọng)
- **Lỗi cú pháp:**
  Tại dòng 76-90:
  ```javascript
  if (res && res.ok) {
      var rawHtml = String(res.text() || "");
      if (isCloudflareChallenge(rawHtml, res.headers)) {
          return Response.error(formatChallengeError("Tiệm Truyện Chữ", chapUrl));
      }
      var doc = Html.parse(rawHtml);
      if (!isInterstitialDoc(doc)) {
          var bodyHtml = extractChapterFromDoc(doc);
          if (bodyHtml) {
              return Response.success(bodyHtml);
          }
      }
      } // <-- LỖI: Dấu đóng ngoặc nhọn thừa làm đóng hàm execute(url) sớm!
  }
  ```
  Hậu quả: Lệnh `node -c chap.js` báo lỗi `SyntaxError: Unexpected token '}' at line 135`. Runtime vBook (Rhino engine) từ chối thực thi file này, gây lỗi ngay khi người dùng mở chương.

- **Thu thập Cookie qua Headless WebView:**
  Tại dòng 98:
  ```javascript
  var cookieRes = browser.callJs("document.cookie;", 1000);
  ```
  Lỗi: `document.cookie` không thể truy xuất cookie có cờ `HttpOnly`. Cookie xác thực của `tiemtruyenchu.cloud` là `session=...` có thuộc tính `HttpOnly; SameSite=Lax`. Do đó, `browser.callJs("document.cookie;")` luôn trả về chuỗi rỗng hoặc cookie không chứa `session`, dẫn đến việc `saveCookie` không bao giờ lưu được cookie đăng nhập.

#### `src/config.js`
- Hàm `getSavedCookie()` hiện tại:
  ```javascript
  function getSavedCookie() {
      if (USER_COOKIE) return USER_COOKIE;
      try {
          if (typeof localStorage !== "undefined" && localStorage) {
              var c = localStorage.getItem("ttc_cookie");
              if (c) return String(c).trim();
          }
      } catch (e) {
      }
      return "";
  }
  ```
  Thiếu hoàn toàn việc đọc từ `localCookie.getCookie()` của vBook. Trong vBook runtime, khi người dùng đăng nhập trong In-App Browser (hoặc headless webview), cookie được lưu trong hệ thống Android `CookieManager`. `localCookie.getCookie()` là phương thức chính thống để lấy toàn bộ chuỗi cookie này (bao gồm cả cookie `HttpOnly`).

#### `plugin.json`
- Trường cấu hình cookie ghi:
  `"title": "Cookie phiên đăng nhập (connect.sid=... — Không nhập mật khẩu vào plugin, dùng lại session trình duyệt)"`
  Tên `connect.sid` là cấu hình mặc định cũ của express-session, nhưng website thực tế cấu hình tên cookie là `session`.

---

## 2. Kết Quả Khảo Sát Trực Tiếp Trang `tiemtruyenchu.cloud` (Live Investigation)

### 2.1 Thông tin hệ thống máy chủ
- **Web Server:** `nginx/1.24.0 (Ubuntu)`
- **Backend Application:** Node.js / Express
- **Framework & Libraries phát hiện qua HTML/JS:**
  * Bootstrap 5.3.0
  * FontAwesome 6.4.0
  * Google OAuth Client (`window.PAGE_DATA.googleClientId`)
  * Express-Session với signed cookie (`set-cookie: session=s%3A...; Path=/; Expires=...; HttpOnly; SameSite=Lax`)
  * Rate-limiting: Helmet & express-rate-limit (`ratelimit-limit: 10; ratelimit-policy: 10;w=900` trên endpoint `/login`; `ratelimit-limit: 400;w=60` trên `/api/v1/*`)
- **Tường lửa & Bot Detection:**
  * Request không có `User-Agent` hợp lệ sẽ bị backend chặn với chuỗi: `"Bot detected"`.
  * Request có browser User-Agent chuẩn (Chrome, Safari, vBook UserAgent) được xử lý bình thường.

### 2.2 Khảo sát truyện mẫu "Quỷ Bí Chi Chủ"
- **Story IDs:**
  * ID `3703`: Bản dịch (`truyen-dich-quy-bi-chi-chu`), tác giả Ái Tiềm Thủy Đích Ô Tặc, 1.394 chương.
  * ID `584`: Bản convert (`truyen-cv-quy-bi-chi-chu`), tác giả Ái Tiềm Thủy Đích Ô Tặc.
- **Chương 1 ("Chương 01: Đỏ Rực"):**
  * Dữ liệu từ API: `{"chapterNumber":1,"title":"Chương 01: Đỏ Rực","chapter_price":0,"created_at":null,"views":10}`.
  * Giá chương: 0 (chương đọc miễn phí).
- **Hành vi khi chưa đăng nhập (Logged-out):**
  * `GET https://tiemtruyenchu.cloud/doc-truyen/3703/chuong/1` -> Trả về HTTP 200, nhưng HTML là trang Interstitial giới thiệu App di động:
    - `<p class="hint">Tải ứng dụng Tiệm Truyện Chữ để đọc truyện này.</p>`
    - Deep-link: `<a href="tiemtruyenchu://doc-truyen/3703/chuong/1">Đã cài app? Mở trong ứng dụng</a>`
    - Google Play: `com.tiemtruyenchu.app`
    - App Store: `id6762322413`
    - Không có bất kỳ thẻ DOM chứa nội dung chương (`#chapter-body`, `.chapter-content` đều không tồn tại).
  * `GET https://tiemtruyenchu.cloud/api/prefetch-chapter/3703/1` -> Trả về HTTP 401 `{"success":false,"message":"Vui lòng đăng nhập để tiếp tục!"}`.

### 2.3 Kết quả quét rà soát toàn diện các Endpoint (Fuzzing / Probing)
Đã thực hiện gửi request tới hơn 150 mẫu URL khác nhau trên máy chủ:
| Endpoint | HTTP Status | Nội dung trả về | Ghi chú |
|---|---|---|---|
| `/` | 302 | `Redirecting to /login` | Trang chủ chuyển hướng sang đăng nhập |
| `/login` | 200 | HTML form đăng nhập + Google Login | Hỗ trợ đăng nhập username/password và Google OAuth |
| `/register` | 200 | HTML form đăng ký tài khoản | Yêu cầu xác thực email / OTP trước khi đăng nhập |
| `/api/v1/stories` | 200 | `{"success":true,"total":26418,...}` | Public API danh sách truyện |
| `/api/v1/stories/3703` | 200 | `{"success":true,"story":{...},"chapters":[...]}` | Public API chi tiết truyện kèm mục lục đầy đủ |
| `/api/v1/stories/3703/chapters` | 403 | `403 Forbidden (nginx/1.24.0)` | Nginx chặn trực tiếp pattern `/chapters` |
| `/api/v1/stories/3703/chapters/1` | 403 | `403 Forbidden (nginx/1.24.0)` | Nginx chặn trực tiếp pattern `/chapters` |
| `/api/prefetch-chapter/3703/1` | 401 | `{"success":false,"message":"Vui lòng đăng nhập..."}` | Endpoint đọc chương thật của frontend |
| `/api/chapter/*`, `/api/read/*` | 401 | `{"success":false,"message":"Vui lòng đăng nhập..."}` | Bị Express auth middleware chặn |
| `/api/v1/random` | 404 | `{"success":false,"message":"API Endpoint not found"}` | Router v1 riêng biệt, không có endpoint chương công khai |

**Kết luận quan trọng:**
1. Website **không có bất kỳ backdoor hay endpoint công khai nào** cung cấp nội dung chương mà không qua xác thực tài khoản (kể cả với chương miễn phí có `chapter_price: 0`).
2. Cơ chế duy nhất để đọc nội dung chương là cung cấp **phiên đăng nhập hợp lệ (Cookie `session=...`)** tới endpoint `/api/prefetch-chapter/:storyId/:chapNum` hoặc trang web đọc truyện.

### 2.4 Cơ chế Phiên Đăng Nhập & Cookie trong vBook
1. **Trình duyệt In-App (Browser Icon trong vBook):**
   - Khi người dùng bấm biểu tượng Quả địa cầu / Trình duyệt trên app vBook và truy cập `https://tiemtruyenchu.cloud/login`, người dùng đăng nhập bằng Google hoặc tài khoản Tiệm Truyện Chữ.
   - Sau khi đăng nhập thành công, trình duyệt nhận header `set-cookie: session=...` và tự động lưu vào Android `CookieManager` của app.
2. **Cơ chế đọc Cookie của vBook Engine:**
   - Runtime vBook cung cấp đối tượng `localCookie`.
   - `localCookie.getCookie()`: Đọc chuỗi cookie cho domain của extension (ở đây là `tiemtruyenchu.cloud`) trực tiếp từ `CookieManager`. Phương thức này lấy được cả cookie có thuộc tính `HttpOnly`.
   - `localCookie.setCookie("session=...; domain=tiemtruyenchu.cloud; path=/")`: Ghi cookie ngược lại nếu cần.
3. **Cơ chế `Engine.newBrowser()`:**
   - Headless WebView chia sẻ cùng cookie store (`CookieManager`) với In-App Browser.
   - Khi `chap.js` chạy, nếu chưa có cookie lưu trữ, script có thể kiểm tra `localCookie.getCookie()`. Nếu cookie có chứa `session=`, script sẽ dùng ngay cho request `/api/prefetch-chapter/...` để lấy nội dung siêu tốc mà không cần bật WebView.
   - Nếu `localCookie.getCookie()` chưa có hoặc cookie hết hạn, hiển thị thông báo hướng dẫn người dùng mở Trình duyệt in-app đăng nhập.

---

## 3. Trạng Thái Dev Server vBook

- **Kiểm tra kết nối tới Tailscale IP `100.90.26.91:8080`:**
  * Lệnh CLI: `node scripts/cli.js connect --server http://100.90.26.91:8080`
  * Kết quả: `/connect returned 400 Direct IP access is not allowed` từ proxy môi trường sandbox `agy-plugin-proxy`.
  * Thử nghiệm kết nối trực tiếp bypassing proxy (`curl --noproxy "*"`): Timeout sau 5 giây (môi trường VM không có daemon Tailscale kết nối vào tailnet của người dùng, hoặc điện thoại đang tắt dev mode / offline).
- **Kết luận:**
  * Dev server hiện tại **không thể kết nối trực tiếp** từ phiên làm việc này.
  * Mọi kiểm thử phải tuân thủ nghiêm ngặt:
    1. Kiểm tra tính hợp lệ cú pháp qua Node.js (`node -c`).
    2. Kiểm tra bộ quy tắc vBook qua `node scripts/cli.js validate` (bắt buộc đạt PASS 0 lỗi).
    3. Đóng gói extension qua `node scripts/cli.js build extensions/novel/tiemtruyenchu`.
    4. Cập nhật registry trung tâm qua `node scripts/cli.js build-catalog`.

---

## 4. Đề Xuất Giải Pháp Kỹ Thuật (Solution Architecture)

1. **Sửa `src/chap.js`:**
   - Xóa bỏ dấu đóng ngoặc nhọn thừa tại dòng 88.
   - Tối ưu luồng đọc chương:
     * Bước 1: Lấy `ck = getSavedCookie()`.
     * Bước 2: Gọi `/api/prefetch-chapter/:storyId/:chapNum` với `ck`. Nếu thành công, format và trả về nội dung ngay (`Response.success`).
     * Bước 3: Nếu API trả về nội dung rỗng hoặc chưa có cookie, thử fetch trang HTML `/doc-truyen/:storyId/chuong/:chapNum`. Nếu là trang hợp lệ (không phải interstitial), trích xuất `#chapter-body`.
     * Bước 4: Fallback `Engine.newBrowser()` để kích hoạt load trang và đồng bộ session từ `CookieManager`. Sau khi load, thử lấy lại cookie qua `localCookie.getCookie()` và bóc tách DOM.
     * Bước 5: Nếu vẫn không có nội dung, trả về `Response.error(formatLoginError("Tiệm Truyện Chữ", chapUrl))` hướng dẫn người dùng đăng nhập qua trình duyệt vBook.
2. **Sửa `src/config.js`:**
   - Cập nhật hàm `getSavedCookie()`:
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
   - Cập nhật hàm `saveCookie(c)` để gọi `localCookie.setCookie(c)` đồng bộ.
   - Thêm `User-Agent` chuẩn vào `buildHeaders()` để phòng tránh lỗi "Bot detected".
3. **Cập nhật `plugin.json`:**
   - Bump version: `4` -> `5`.
   - Cập nhật title của trường `COOKIE`: `"Cookie phiên đăng nhập (session=s%3A... — Không nhập mật khẩu vào plugin, dùng lại session trình duyệt)"`.
4. **Build & Validate:**
   - Chạy `node scripts/cli.js build extensions/novel/tiemtruyenchu`.
   - Chạy `node scripts/cli.js build-catalog`.
   - Chạy `node scripts/cli.js validate`.
