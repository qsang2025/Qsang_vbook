# Bối cảnh Kỹ thuật: Khảo sát Nguồn fanqienovel.com (番茄小说)

Tài liệu này ghi nhận toàn bộ thông tin ngữ cảnh, dữ liệu kiểm chứng ban đầu, các quy tắc kiến trúc của vBook và các trích đoạn hợp đồng API (`extension-api.md`) phục vụ khảo sát nguồn `fanqienovel.com`.

---

## 1. Dữ liệu Kiểm chứng Trực tiếp từ Master (2026-11-11 00:43–00:52 UTC)

Kiểm thử trực tiếp từ môi trường Linux sandbox kết nối Internet thông qua HTTP/HTTPS proxy:

1. **Trang chủ (`GET https://fanqienovel.com/`):**
   - HTTP 200, Web server: Tengine. CDN ByteDance.
   - Header Content-Security-Policy (CSP) cho phép các domain: `*.snssdk.com`, `*.bytetos.com`, `*.fqnovelstatic.com`.

2. **Chi tiết sách Web SSR (`GET /page/<bookId>` - ví dụ `7069948840148732967`):**
   - HTTP 200, phản hồi SSR chứa payload JSON nhúng: `window.__INITIAL_STATE__`.
   - Vị trí parse: nằm giữa `__INITIAL_STATE__=` và `;\n            }\n        )(`.
   - Chứa đầy đủ thông tin: tên truyện, tác giả, ảnh bìa, danh sách chương phân theo tập (`page.chapterListWithVolume`), và `item_id` tương ứng từng chương.

3. **Nội dung chương Web SSR (`GET /reader/<itemId>` - ví dụ `7069952706521236001`):**
   - HTTP 200, SSR `__INITIAL_STATE__.reader.chapterData` chứa:
     - `title`: Tiêu đề chương.
     - `needPay: 0`: Đánh dấu trạng thái trả phí.
     - `content`: HTML chứa các thẻ `<p>...</p>`.
   - **Hiện tượng mã hóa Font (PUA Font Encryption):**
     - Tổng độ dài chuỗi ~5.077 ký tự, trong đó có **2.113 ký tự thuộc dải Private Use Area (PUA) U+E400–U+E5FF** (chiếm ~41.6% tổng ký tự, tương đương ~60% toàn bộ số chữ Hán trong chương).
     - File CSS kèm theo (`common.css`) định nghĩa động quy tắc `@font-face` trỏ về CDN: `https://lf6-awef.bytetos.com/obj/awesome-font/c/<hash>.woff2`.

4. **Web API Reader Full (`GET /api/reader/full?itemId=...`):**
   - HTTP 200, nhưng `Content-Length: 0` (body rỗng).
   - Xuất hiện response header `bdturing-verify: {"subtype":"slide",...}` yêu cầu người dùng giải captcha trượt.

5. **Web API Search (`GET /api/author/search/search_book/v1?...query_word=剑来`):**
   - HTTP 200, body rỗng kèm header `bdturing-verify` (kích hoạt captcha chống bot).
   - Trang HTML tìm kiếm `/search/page?...` trả về HTTP 200 nhưng render theo mô hình Client-Side Rendering (CSR), `searchBookList: null` trong SSR state ban đầu.

6. **Web API Metadata & TOC Chi tiết (Mở, không bị bdturing):**
   - `GET /api/book/info?bookId=...` → HTTP 200, trả về JSON đầy đủ các trường: `bookName`, `author`, `abstract`, `thumbUrl`, `wordNumber`, `lastChapterTitle`, `categoryV2`...
   - `GET /api/reader/directory/detail?bookId=...` → HTTP 200, trả về JSON danh sách chương: `itemId`, `title`, `needPay`, `isChapterLock`, `volume_name`, `realChapterOrder`.

7. **Trang mobile & App API Gateway:**
   - `m.fanqienovel.com`: Trả về HTTP 502 Bad Gateway.
   - `novel.snssdk.com/api/novel/book/directory/list/v1/`: HTTP 200 nhưng body rỗng (dù có hay không có User-Agent app).
   - `api5-normal-c-lf.fqnovel.com`: Không thể phân giải DNS (NXDOMAIN/không route) qua proxy VM.

8. **Frontend Script Bundle (`//lf-fe.fqnovelstatic.com/obj/novel-fanqie-fe/toutiao/muye/js/muye_f9eb17e2.js`):**
   - Lộ diện danh mục các endpoint nội bộ của nền tảng web Fanqie:
     - `/api/book/info`
     - `/api/reader/directory/detail`
     - `/api/reader/directory/list`
     - `/api/reader/directory/iid`
     - `/api/reader/full`
     - `/api/author/library/book_list/v0/`
     - `/api/author/book/category_list/v0/`
     - `/api/rank/category/list`
     - `/api/rank/recommend/list`
     - `/api/rank/recent/update/list`
     - `/api/author/misc/top_book_list/v1/`
     - `/api/library/book_list`
     - `/api/comment/get_book_comment`
     - `/api/author/search/search_book/v1`

---

## 2. Quy tắc Kiến trúc Repo vBook (`AGENTS.md`)

Các quy tắc cốt lõi áp dụng trực tiếp khi nghiên cứu và xây dựng giải pháp:
1. **Runtime giới hạn Rhino ES6:**
   - Chỉ hỗ trợ cú pháp `var`, `function`, nối chuỗi `+`.
   - Tuyệt đối cấm: `const`, `let`, `async/await`, arrow function (`() => {}`), template literals (`` ` ``), optional chaining (`?.`), nullish coalescing (`??`), spread operator (`...`).
   - Xử lý lỗi luôn dùng `Response.error("Thông báo tiếng Việt")`, tuyệt đối không `return null`.
2. **Cơ chế `load()` cấp engine (Rhino ES6 `load()` Constraint):**
   - `load('file.js')` là chèn văn bản ở top-level thư mục `src/`, không đệ quy (file được load không được gọi load file khác).
   - Tuyệt đối không viết `load('...')` trong comment.
3. **Pacing Request chống rate-limit (Quy tắc 6.11):**
   - Tối đa 1 request/lần/host, giãn cách an toàn ≥ 2-3 giây giữa các request trên các host nhạy cảm.
   - Khi gặp HTTP 405/429/503: kích hoạt backoff hoặc dừng hẳn, tuyệt đối không spam request làm khóa IP WAF.
4. **Trang chủ tĩnh (`home.js`):**
   - `home.js` chỉ trả mảng tab tĩnh định nghĩa sẵn, không thực hiện HTTP fetch để tránh khóa toàn bộ giao diện extension khi mạng chập chờn.
5. **Cấu hình tên miền động (`config.js`):**
   - Không hardcode domain trong các script riêng lẻ, trỏ qua `BASE_URL`.
6. **Bảo mật & Không lưu trữ token/secret:**
   - Tuyệt đối không commit token, cookie cá nhân, khóa giải mã hoặc mật khẩu vào mã nguồn.

---

## 3. Khảo sát Hợp đồng API vBook (`extension-api.md`)

Các tính năng liên quan trực tiếp đến khả năng render web, cookie và headless browser trong runtime vBook:

### 3.1. Headless WebView (`Engine.newBrowser()`) — Dòng 1422–1478
- Runtime vBook cung cấp API `Engine.newBrowser()`:
  - `let browser = Engine.newBrowser();`
  - `browser.launch(url, timeoutMs)`: Tải URL và đợi trang tải xong, trả về DOM (`HtmlDocument`).
  - `browser.launchAsync(url)`: Tải bất đồng bộ.
  - `browser.waitUrl(patterns, timeoutMs)`: Chờ URL khớp regex được gọi bởi trang.
  - `browser.html(timeoutMs)`: Đợi một khoảng thời gian rồi trả về DOM hiện tại.
  - `browser.callJs(code, timeoutMs)`: Chạy mã JavaScript bên trong trang web. Chuỗi trả về được parse thành `HtmlElement`.
  - `browser.loadHtml(baseUrl, htmlString)`: Tải trực tiếp mã HTML với base URL chỉ định.
  - `browser.setUserAgent(userAgent)`: Ghi đè User-Agent.
  - `browser.close()`: Đóng WebView giải phóng tài nguyên.
  - `browser.getVariable(key)`: Đọc giá trị được lưu qua lệnh gọi native `_callNativeFunction(JSON.stringify(['putVariable', key, value]))` từ trong script trang web.

### 3.2. Quản lý Cookie & Session — Dòng 1221–1222, 1330–1332
- Cơ chế Cookie trong HTTP request:
  - vBook tự động duy trì app cookie jar cho từng domain nguồn.
  - Header `Cookie` truyền trong `fetch()` được lưu vào cookie jar; header `Set-Cookie` trả về từ server được app tự động lưu lại.
- Thao tác trực tiếp với Cookie:
  - `localCookie.setCookie("name=value; path=/")`: Đặt cookie thủ công cho domain nguồn.
  - `let cookie = localCookie.getCookie()`: Đọc chuỗi cookie hiện hành của domain nguồn.

### 3.3. Định dạng Trả về của `chap.js` (Trang Đọc Truyện) — Dòng 886–910
- Đối với định dạng tiểu thuyết (`type: "novel"`):
  - `Response.success(content, chapterTitle)`:
    - Tham số thứ nhất `content`: Là chuỗi HTML text hiển thị nội dung chương.
    - Tham số thứ hai `chapterTitle`: Tên chương hiển thị trên thanh công cụ điều hướng.
- **Giới hạn quan trọng của Trình đọc vBook:**
  - Trình đọc tiểu thuyết tiêu chuẩn của vBook sử dụng Native Text View (render text từ HTML cơ bản như `<p>`, `<br>`).
  - Trình đọc tiểu thuyết không phải là một trình duyệt web hoàn chỉnh (không chạy CSS engine đầy đủ để tự động tải font động `@font-face` từ URL ngoài trừ khi chuỗi HTML được đóng gói đặc thù hoặc tích hợp qua webview reader).

### 3.4. Liên kết Web / Tải Ebook Ngoài (`download_links`) — Dòng 748–757, 783, 788–789
- Trong màn hình chi tiết sách (`detail.js`), vBook hỗ trợ cấu hình `download_links`:
  - Mỗi liên kết có cấu trúc: `{ title: "Tên", type: "direct" | "browser", link: "URL" }`.
  - Khi `type: "browser"`, người dùng chạm vào sẽ kích hoạt in-app browser của vBook mở trực tiếp trang web đích.
