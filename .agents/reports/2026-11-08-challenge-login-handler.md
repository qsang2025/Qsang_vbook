# Báo cáo: Triển khai Thư viện Xử lý Cloudflare Challenge & Yêu cầu Đăng nhập kiểu Legado

> **Ngày thực hiện:** 2026-11-08  
> **Nhánh thực hiện:** `feature/challenge-login-popup`  
> **Repo:** `qsang2025/Qsang_vbook`  
> **Người thực hiện:** Sub-agent Executor (Model Flash theo Quota-workflow)  
> **Trạng thái:** HOÀN THÀNH (PASS 100% Validate, Rhino ES6 Linter, Catalog sync)

---

## 1. Giới hạn Kỹ thuật của vBook Extension

Qua đối soát kỹ lưỡng file hợp đồng chuẩn duy nhất `extension-api.md`:
1. **Không có API popup / In-App Browser tương tác trực tiếp từ JavaScript extension**:
   - Extension chạy trong máy ảo JavaScript Rhino ES6 (`ScriptExecutor`).
   - Engine vBook chỉ cung cấp Headless WebView qua `Engine.newBrowser()`.
   - Headless WebView hoạt động ngầm (background), không mở cửa sổ UI để người dùng click chọn "Tôi là con người" (Cloudflare Turnstile) hay điền form tài khoản/mật khẩu trực tiếp.
2. **Cơ chế giải quyết tối ưu (Legado-style thích ứng vBook)**:
   - **Tự động nhận diện**: Phân tích HTML response và headers để bắt dấu hiệu Cloudflare Challenge (`cf-mitigated: challenge`, `challenges.cloudflare.com`, `cf-turnstile`, "Just a moment...") hoặc thông báo yêu cầu đăng nhập ("Vui lòng đăng nhập", "Chương VIP yêu cầu đăng nhập", "login-required"...).
   - **Thử tự động vượt qua bằng Headless WebView (`Engine.newBrowser`)**: Tận dụng cơ chế dùng chung kho Cookie / WebStorage giữa In-App Browser và Headless WebView trong ứng dụng Android vBook. Nếu người dùng đã từng mở trình duyệt trong app và đăng nhập / vượt xác minh, Headless WebView có thể thừa hưởng cookie phiên đó.
   - **Hướng dẫn từng bước bằng tiếng Việt**: Nếu thử ngầm vẫn không thành công, trả về `Response.error(...)` hướng dẫn chi tiết người dùng mở trình duyệt vBook (icon quả địa cầu) để xác minh hoặc đăng nhập, sau đó quay lại ứng dụng tải lại truyện.

---

## 2. Thư viện Dùng chung `lib/challenge-handler.js`

Đã tạo mới file [lib/challenge-handler.js](file:///home/antigravity/qsang2025/Qsang_vbook/lib/challenge-handler.js) với các đặc tính:
- **Tuân thủ tuyệt đối chuẩn Rhino ES6**:
  * Chỉ dùng cú pháp `var`, `function`, nối chuỗi bằng `+`.
  * Không sử dụng `const`, `let`, arrow functions (`=>`), template literals, `?.`, `??`, spread operator (`...`).
  * Không chứa lệnh `load(...)` (tuân thủ quy tắc load không đệ quy của vBook runtime).
- **Các hàm tiện ích cốt lõi**:
  1. `isCloudflareChallenge(html, headers)`: Quét dấu hiệu Cloudflare qua response headers và nội dung trang (Turnstile, challenge captcha, script domain).
  2. `isLoginRequired(html, url)`: Quét các chuỗi thông báo yêu cầu đăng nhập tiếng Việt, tiếng Anh và tiếng Trung.
  3. `isChallengeDoc(doc)`: Kiểm tra tài liệu Document trả về từ WebView có còn nằm ở trang chờ Cloudflare hay không.
  4. `fetchViaBrowser(url, timeoutMs)`: Khởi tạo `Engine.newBrowser()`, tải trang với vòng lặp chờ hết trang thử thách, giải phóng tài nguyên qua `browser.close()`.
  5. `fetchWithChallengeHandler(url, options)`: Thử fetch thông thường qua `fetch()`; nếu phát hiện challenge/login thì tự động fallback sang `Engine.newBrowser()`. Trả về trạng thái chi tiết (`ok`, `isChallenge`, `isLogin`, `error`, `html`, `doc`).
  6. `formatChallengeError(siteName, url)`: Mẫu thông báo chuẩn hướng dẫn vượt Cloudflare.
  7. `formatLoginError(siteName, url)`: Mẫu thông báo chuẩn hướng dẫn đăng nhập tài khoản.

---

## 3. Danh sách 5 Extension đã Tích hợp & Cập nhật Version

| STT | Extension | Đường dẫn | Version cũ | Version mới | Nội dung nâng cấp |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | **Sáng Tác Việt** | `extensions/novel/sangtacviet/` | 3 | **4** | Đảm bảo `BASE_URL = "https://sangtacviet.app"`; tích hợp `challenge-handler.js` vào `detail.js`, `chap.js`, `toc.js`. Tự động nhận diện Cloudflare và trả lỗi hướng dẫn chi tiết. |
| 2 | **La Cà Truyện** | `extensions/novel/lacatruyen/` | 3 | **4** | Tích hợp `challenge-handler.js` vào `chap.js`. Khi gặp trạng thái yêu cầu đăng nhập (`not_login`) hoặc Cloudflare, hiển thị thông báo hướng dẫn đăng nhập hoặc vượt challenge qua in-app browser. |
| 3 | **Tiệm Truyện Chữ** | `extensions/novel/tiemtruyenchu/` | 2 | **3** | Tích hợp `challenge-handler.js` vào `chap.js`. Thay thế chuỗi báo lỗi cũ bằng `formatLoginError` và `formatChallengeError` chuẩn hóa. |
| 4 | **App Truyện Chữ** | `extensions/novel/apptruyenchu/` | 4 | **5** | Tích hợp `challenge-handler.js` vào `chap.js`. Tự động kiểm tra fallback browser và hiển thị hướng dẫn khi phát hiện trang lỗi/bị chặn. |
| 5 | **Bút Thú Các (笔趣阁)** | `extensions/novel/biquge/` | 1 | **2** | Tích hợp `challenge-handler.js` vào `chap.js` và `detail.js`. Khắc phục tình trạng bị Cloudflare chặn gây lỗi không tải được truyện/chương. |

---

## 4. Mẫu Thông báo Lỗi Tiếng Việt Hiển thị cho Người dùng

### A. Mẫu thông báo khi gặp Cloudflare Challenge:
```text
Website [Tên Website] đang kích hoạt xác minh Cloudflare (chống bot).

Hướng dẫn vượt qua:
1. Mở icon Trình duyệt (quả địa cầu / Mở trang gốc) tích hợp trong app vBook.
2. Truy cập: [URL truyện hoặc chương]
3. Chờ hoặc tích chọn xác minh 'Tôi là con người' trên màn hình cho đến khi vào được trang web.
4. Sau khi hoàn tất, quay lại đây và tải lại truyện.
```

### B. Mẫu thông báo khi gặp trang Yêu cầu Đăng nhập:
```text
Website [Tên Website] yêu cầu đăng nhập để xem nội dung chương này.

Hướng dẫn đăng nhập:
1. Mở icon Trình duyệt tích hợp trong app vBook.
2. Truy cập: [URL truyện hoặc chương]
3. Tiến hành đăng nhập tài khoản của bạn trên website.
4. Sau khi đăng nhập thành công, quay lại đây và tải lại truyện.
```

---

## 5. Đóng gói, Đồng bộ Registry & Kết quả Kiểm thử (Validation)

1. **Đóng gói (Build)**:
   - Đã chạy `node scripts/cli.js build extensions/novel/<tên>` cho toàn bộ 5 extension.
   - Cơ chế lib-inline tự động phát hiện lệnh `load('challenge-handler.js')` và chèn file từ `lib/` vào `plugin.zip`.
2. **Đồng bộ Registry**:
   - Đã chạy `node scripts/cli.js build-catalog` cập nhật lại file `plugin.json` ở root repo.
   - `node scripts/cli.js build-catalog --check` xác nhận khớp 17/17 nguồn trên đĩa.
3. **Kiểm tra tính toàn vẹn (Validate)**:
   - Đã chạy `npm run validate` (`node scripts/cli.js validate`).
   - Kết quả: **PASS (0 lỗi, 0 cảnh báo)** trên toàn bộ 17 nguồn:
     * Linter Rhino ES6 kiểm tra không có cú pháp cấm.
     * Catalog ≡ Đĩa.
     * Phiên bản trong manifest nguồn khớp chính xác với `plugin.json` ở root.
     * Mọi `plugin.zip` đều khớp 100% với mã nguồn `src/` và các file lib inline.

---

## 6. Ghi nhận Thực tế về Cơ chế Đồng bộ Cookie trên Thiết bị Di động

1. **Đăng nhập (Login Session)**:
   - Cookie đăng nhập thông thường (session cookie, remember token) được WebView Android chia sẻ đồng bộ rất tốt với CookieManager của app vBook. Khi người dùng đăng nhập trong trình duyệt của vBook, headless browser và các request sau đó sẽ kế thừa được phiên đăng nhập.
2. **Cloudflare `cf_clearance`**:
   - Cookie `cf_clearance` của Cloudflare gắn liền với User-Agent và TLS fingerprint. Vì app vBook sử dụng chung User-Agent hệ thống (`UserAgent.system()`) giữa In-App Browser và `Engine.newBrowser()`, khi người dùng giải thành công captcha Turnstile trên In-App Browser, cookie `cf_clearance` được lưu vào CookieManager hệ thống, giúp các lần gọi sau đó từ app tiếp tục hoạt động.
   - Để đạt hiệu quả tốt nhất trên điện thoại, người dùng chỉ cần làm theo 4 bước trong thông báo hướng dẫn.
