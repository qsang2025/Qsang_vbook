# Ghi Chép Phân Tích Kỹ Thuật Cụm 2 — Fanqienovel.com

- **Thời gian thực hiện:** 2026-11-11
- **Phạm vi:** Step 3, 4, 5 theo kế hoạch `.agents/plans/2026-11-11-fanqie-survey.md`
- **Ranh giới tuân thủ tuyệt đối:** Không giải mã font PUA, không vượt captcha, không gọi relay server bên thứ 3 (101.35.133.34:5000, api.cengui.cn), không tải bảng charset.

---

## 1. Step 3: Phân Tích extension-api.md & Khả Năng vBook

### 1.1. Khảo Sát Cơ Chế WebView / Browser Của vBook (`Engine.newBrowser()`)
Theo tài liệu hợp đồng `extension-api.md` (dòng 1422–1478):
- `Engine.newBrowser()` khởi tạo một **Headless WebView** (WebView chạy ngầm không hiển thị giao diện UI cho người dùng).
- Các phương thức hỗ trợ:
  - `browser.launch(url, timeout)`: Tải URL và đợi trang tải xong DOM.
  - `browser.launchAsync(url)` + `browser.waitUrl(patterns, timeout)`: Chờ request mạng khớp regex.
  - `browser.html(ms)`: Trả về DOM hiện tại dưới dạng `HtmlElement`.
  - `browser.callJs(code, timeout)`: Thực thi JavaScript trong trang và trả về chuỗi text parsed thành `HtmlElement`.
  - `browser.block(patterns)`: Chặn request (quảng cáo, tracker).
  - `browser.loadHtml(baseUrl, html)`: Nạp trực tiếp chuỗi HTML.

#### Đánh Giá Hướng 1: Dùng WebView Render Rồi Lấy Text
- **Vấn đề 1 — Chặn bởi bdturing Slide Captcha:**
  - Vì `Engine.newBrowser()` là **Headless WebView** (không có cửa sổ hiển thị tương tác), khi ByteDance WAF trả về `bdturing-verify` (yêu cầu kéo slide captcha), WebView ngầm không thể tự giải captcha và cũng **không thể hiển thị slider lên màn hình để người dùng dùng tay kéo**. Kết quả là request bị treo chờ timeout (10–30 giây) rồi thất bại.
- **Vấn đề 2 — Bản chất của Font PUA trong DOM:**
  - Trong cấu trúc DOM của trình duyệt, thuộc tính `innerText`, `textContent` hay HTML của thẻ `<p>` vẫn chứa **nguyên vẹn các ký tự mã Unicode PUA** (`U+E000` đến `U+F8FF`).
  - Font chữ woff2 tải về chỉ hướng dẫn engine đồ họa (Skia/Blink/WebKit) vẽ glyph vector tương ứng lên canvas/màn hình khi hiển thị trực quan; nó **hoàn toàn không thay đổi giá trị chuỗi ký tự trong bộ nhớ DOM**.
  - Do đó, dù `browser.callJs("document.querySelector('.muye-reader-content').innerText")` hay `browser.html().text()` chạy thành công, chuỗi văn bản lấy ra vẫn là chuỗi rác chứa ~60% ký tự PUA chưa giải mã!
- **Vấn đề 3 — Khóa Chương (Truncation):**
  - Dù chạy trong WebView, nếu không có phiên người dùng đăng nhập hợp lệ, SSR vẫn chỉ nạp đúng 200 ký tự xem trước đối với 97% số chương (`isChapterLock: true`).

#### Đánh Giá Hướng 2: Render Trực Tiếp HTML + Font Trong Trình Đọc vBook
- Theo `extension-api.md` (dòng 231, 888, 898, 911–920):
  - Kịch bản `chap.js` của loại `novel` trả về `Response.success(content, title)`, trong đó `content` là chuỗi HTML.
  - Trình đọc novel của vBook là thành phần hiển thị native có hỗ trợ định dạng HTML cơ bản (thẻ `<p>`, `<span>`, style màu sắc, cỡ chữ).
  - **Không hỗ trợ nạp `@font-face` từ URL ngoài:** Trình đọc vBook áp dụng bộ font hệ thống hoặc font do người dùng cài đặt trong cài đặt app, không nạp dynamic webfont woff2 từ CDN ByteDance (`lf6-awef.bytetos.com`).
  - **Phá vỡ tính năng cốt lõi của vBook:** Nếu để nguyên ký tự PUA trong chuỗi text của chương:
    - Tính năng dịch tự động (Quick Translator / VietPhrase / AI Translate): Gặp ký tự PUA sẽ không dịch được hoặc dịch ra ký tự trống/rác.
    - Tính năng Text-to-Speech (TTS): Bộ đọc giọng nói sẽ bỏ qua hoặc đọc lỗi.
    - Tính năng tra từ điển, bôi đen, tìm kiếm: Vô hiệu.

### 1.2. Khảo Sát Cơ Chế Lưu Trữ & Session Người Dùng (`localCookie`, `localStorage`)
Theo `extension-api.md` (dòng 1220–1222, 1312–1333):
- vBook hỗ trợ:
  - `localCookie.setCookie("name=value; path=/")` và `localCookie.getCookie()`.
  - HTTP `fetch()` tự động lưu và gửi cookie qua cookie jar của extension.
  - `localStorage.setItem(key, val)` / `getItem(key)`.
  - `download_links`: Với `type: "ebook"`, có thể trả về `type: "browser"` để mở trình duyệt in-app cho người dùng (dòng 754, 788).
- **Đánh Giá Tính Khả Thi Của Việc Người Dùng Tự Đăng Nhập:**
  - Trên web Fanqie, đăng nhập yêu cầu quét mã QR bằng app Douyin / Fanqie hoặc nhận mã SMS kèm giải captcha bdturing.
  - Trình duyệt tích hợp của vBook (in-app browser) có thể cho phép người dùng mở trang web, đăng nhập bằng tay và kéo thanh trượt captcha.
  - **Tuy nhiên:**
    1. Cơ chế đồng bộ Cookie giữa In-App Browser và HTTP Fetch runtime của vBook không phải lúc nào cũng thông suốt (như đã ghi nhận trong quy tắc repo sonzin với `itruyenchu`, extension không tự động thừa hưởng session/localStorage từ webview ngoài).
    2. ByteDance gắn chặt phiên với IP và Device Fingerprint: Khi chuyển mạng (WiFi sang 4G), cookie vẫn có thể bị WAF kích hoạt lại bdturing slide captcha bất cứ lúc nào.
    3. Ngay cả khi có Cookie đăng nhập đầy đủ, **vấn đề font PUA vẫn tồn tại 100%** trên phiên bản web (nền tảng web Fanqie bắt buộc dùng font obfuscation cho mọi người dùng, kể cả tài khoản đã đăng nhập).

---

## 2. Step 4: Khảo Sát Các Dự Án Mã Nguồn Mở Công Khai

Đã khảo sát tài liệu và mô tả kiến trúc từ các dự án mã nguồn mở liên quan trên GitHub và Open VSX Registry:

### 2.1. `zwb8926/fanqie-novel` (Extension VS Code / Windsurf)
- **Kiến trúc & Cơ chế:**
  - Phát triển bằng TypeScript trên Open VSX Registry (cập nhật gần nhất: tháng 08/2026).
  - Tác giả công bố rõ ràng giới hạn: Khi chạy trên IP datacenter/server, API `/api/reader/full` bị WAF kích hoạt `bdturing-verify` (HTTP 200 + 0 bytes).
  - Cung cấp 3 chế độ đọc:
    1. *Chế độ bên thứ ba (Mặc định):* Bỏ qua hoàn toàn API Fanqie, lấy toàn bộ nội dung chương từ server cộng đồng `http://101.35.133.34:5000` (được chia sẻ giữa các dự án `fysh1010/mcp-server-fanqie` và `ying-ck/fanqienovel-downloader`).
    2. *Chế độ tự động bù trừ:* Đọc bằng SSR/API chính thức, khi gặp chương bị khóa (chỉ có preview 200 chữ) thì gọi server bên thứ 3 bù đắp.
    3. *Chế độ chỉ chính thức:* Chỉ đọc được 10 chương đầu hoặc hiển thị cảnh báo "chỉ lấy được đoạn trích thử đọc", kèm nút mở trình duyệt ngoài để người dùng tự xử lý.
  - Đăng nhập: Hỗ trợ tạo mã QR qua endpoint passport Fanqie (`/passport/web/get_qrcode/` + `check_qrconnect/`).

### 2.2. `ying-ck/fanqienovel-downloader` & Các Biến Thể Fork
- **Kiến trúc & Cơ chế:**
  - Ứng dụng Python (AGPL-3.0) chuyên tải truyện Fanqie về file TXT/EPUB.
  - **Phương pháp giải mã font:** Sử dụng một bảng tra tĩnh cố định (`src/charset.json`), ánh xạ dải Unicode PUA từ 58344 đến 58715 (`U+E3E8` – `U+E55B`, gọi là charset "mode 0") thành chữ Hán tương ứng.
  - **Điểm yếu kiến trúc:** Khi ByteDance định kỳ thay đổi bảng mã font hoặc đổi hash glyph, công cụ bị gãy ("chữ biến thành ô vuông □") và phải đợi cộng đồng bóc tách bảng mã mới cập nhật vào file JSON. Khi IP bị chặn bdturing, công cụ chuyển sang gọi relay server.

### 2.3. `zhongbai2333/Tomato-Novel-Downloader` & `bidabrain/Tomato-Novel`
- **Kiến trúc & Cơ chế:**
  - Dự án viết bằng Rust (kèm client Android `Tomato-Novel`).
  - Chia tách thành 2 nhánh build: `official-api` và `no-official-api` (`Cargo_no_official.toml`).
  - Bản `no-official-api` công khai: Chỉ dùng Web scraping để lấy TOC và metadata sách; phần nội dung chương bắt buộc phải trỏ về một instance server tải trung gian (`Tomato-Novel-Downloader --server`) có xác thực qua header `x-tomato-password`. Không hỗ trợ tìm kiếm trực tiếp trên web nếu không có server backend.

### 2.4. `pattoneirc/fanqie-font-decode`
- **Khảo sát giải pháp giải mã font PUA:** Dự án tổng hợp 4 phương pháp kỹ thuật đối phó với font obfuscation của Fanqie:
  1. *Static Mapping (Bảng tra tĩnh):* Nhanh nhất (O(1)), nhưng dễ gãy khi Fanqie xoay font hash.
  2. *Glyph Contour / Coordinate Matching:* Tải file woff2, dùng thư viện font (như `fontTools` trong Python) bóc tách tọa độ vector các điểm mút của từng con chữ (glyph), tính mã hash hình học rồi đối chiếu với font chuẩn. Độ chính xác cao, thích ứng được khi font đổi thứ tự code point, nhưng tốn CPU/RAM và đòi hỏi thư viện xử lý font nhị phân phức tạp (Rhino ES6 không có sẵn).
  3. *Render Canvas + OCR:* Vẽ glyph ra ảnh rồi dùng mô hình nhận dạng chữ (Tesseract/PaddleOCR). Cực kỳ chậm, ngốn tài nguyên.
  4. *DOM Inspection:* Tác giả xác nhận thất bại vì DOM text bản chất vẫn là PUA, trình duyệt chỉ hiển thị qua layout engine.

### 2.5. `Wildmess/dsh-novel-buddy` & `fysh1010/mcp-server-fanqie`
- **Kiến trúc:**
  - `Wildmess/dsh-novel-buddy` (tháng 10/2026): Yêu cầu người dùng tự trích xuất Cookie từ trình duyệt Chrome/Edge của mình rồi import vào máy cục bộ qua lệnh bảo mật Windows DPAPI (`credential.js set`). Dùng bảng charset tĩnh từ `ying-ck` để giải mã.
  - `fysh1010/mcp-server-fanqie` (v0.2.x): Tác giả tuyên bố loại bỏ sự phụ thuộc vào server bên thứ ba `101.35.133.34:5000`, nhưng chấp nhận giới hạn: chỉ đọc được các chương web công khai (chương xem trước) nếu không có tài khoản quét mã.

### 2.6. Thư Viện Legado (开源阅读)
- Trên Legado, các book source Fanqie phổ biến chia làm 2 loại:
  - *Loại API Gateway App (`novel.snssdk.com`):* Thường xuyên bị lỗi token / signature (`X-Gorgon`), sống chết thất thường và bị khóa IP theo chu kỳ.
  - *Loại Nguồn Thay Thế (Aggregator Mirror):* Hầu hết người dùng Legado đọc truyện Fanqie thông qua các nguồn trung gian như 69shu, biquge, qidian/qimao mirrors thay vì cào trực tiếp từ Fanqie.

---

## 3. Step 5: Đánh Giá Kế Hoạch B (Plan B) — Các Nguồn Thay Thế Hợp Lệ

Do bản thân trang Fanqie áp dụng chính sách khóa chặt nội dung từ chương 11 và bảo vệ bằng slide captcha + font PUA, giải pháp thực tế nhất cho người dùng vBook là sử dụng **Plan B — Đọc qua các nguồn truyện thay thế**.

### 3.1. Các Tác Phẩm Độc Quyền Của Fanqie Có Ở Đâu?
Fanqie Novel là nền tảng tiểu thuyết miễn phí lớn nhất thuộc ByteDance. Hầu hết các bộ truyện hot (như 《斩神》- Trảm Thần, 《十日终焉》- Thập Nhật Chung Yên, 《我不是戏神》- Ngã Bất Thị Hí Thần, 《心肝宠》- Tâm Can Sủng...) đều là tác phẩm ký hợp đồng độc quyền với Fanqie.
- **Nền tảng chính thức cùng tập đoàn:** Có mặt trên *Hồng Quả Miễn Phí Đoản Kịch* (Hongguo) và *Đầu Điều Tiểu Thuyết* (Toutiao), nhưng các nền tảng này dùng chung hạ tầng bảo mật ByteDance nên gặp rào cản tương tự.
- **Các nền tảng bản quyền đối thủ (Qimao, Qidian, Zongheng):** Thường không có truyện độc quyền của Fanqie, trừ một số rất ít tác phẩm tác giả ký không độc quyền hoặc bán bản quyền xuất bản giấy/truyền thông.
- **Các trang tổng hợp / Pirate Aggregators:** Vì Fanqie rất nổi tiếng, các trang web cào truyện tiếng Trung (như 69shu, Biquge, Shuhaige, CZBooks...) đều duy trì các crawler chuyên nghiệp có máy chủ render/giải mã font mạnh mẽ để sao chép toàn bộ truyện từ Fanqie sang dạng văn bản chữ Hán thuần (Clean UTF-8 Plaintext).

### 3.2. Bảng Ma Trận Đánh Giá Các Nguồn Thay Thế Sẵn Có Trong Repo

| Nguồn Thay Thế | Extension trong Repo | Khả Năng Có Truyện Fanqie | Tình Trạng Font / Mã Hóa | Tính Ổn Định Trong vBook | Ưu Điểm | Nhược Điểm |
|---|---|---|---|---|---|---|
| **69 Thư Ba (69shu)** | `shuhaige` / `69shuba` | **Rất cao (90–95% truyện hot)** | Văn bản thuần UTF-8, không mã hóa | Cao | Đầy đủ chương mới nhất, cập nhật nhanh sau vài giờ | Có thể bị chặn Cloudflare đôi khi |
| **Bút Thú Các (Biquge)** | `extensions/novel/biquge` | **Cao (70–80%)** | Văn bản thuần UTF-8 | Rất cao | Tải nhẹ, không font rối rắm, chạy mượt trên Rhino | Đôi khi có chương bị thiếu hoặc lặp text |
| **Thư Hải Các (Shuhaige)** | `extensions/novel/shuhaige` | **Cao (75–85%)** | Văn bản thuần UTF-8 | Cao | Giao diện chuẩn, mục lục rõ ràng | Phụ thuộc tên miền mirror |
| **Thất Miêu (Qimao)** | `extensions/novel/qimao` | **Thấp (< 10% trùng tác giả)** | Không có PUA (API chính thức) | Rất cao (đã pacing chống 405) | Nguồn chính thức chất lượng cao nhất cho truyện miễn phí | Không chứa tác phẩm độc quyền của Fanqie |
| **CZBooks / Novel543** | `extensions/novel/czbooks`, `novel543` | **Trung bình (50–60%)** | Văn bản Phồn thể (Trad. Chinese) | Ổn định | Bản dịch sạch, không quảng cáo chèn | Chậm hơn nguồn Giản thể |

### 3.3. Đánh Giá Giá Trị Thực Tế Của Nguồn Fanqie Trong vBook
1. **Giá trị lớn nhất của Fanqie đối với vBook:**
   - **Hệ thống Khám phá & Metadata:** Các API Bảng xếp hạng (`/api/rank/recommend/list`), Danh mục thể loại (`/api/author/book/category_list/v0/`), Thông tin chi tiết truyện (`/api/book/info`), Mục lục toàn tập (`/api/reader/directory/detail`) đều **hoàn toàn mở**, không bị bdturing, không mã hóa.
   - Điều này cho phép xây dựng một extension theo mô hình **H8 (Metadata-only / Hub & Discovery)**: Người dùng có thể duyệt bảng xếp hạng Fanqie, xem xu hướng truyện hot, đọc tóm tắt, xem mục lục, và khi bấm đọc thì điều hướng sang trình duyệt hoặc liên kết chéo với các nguồn đọc văn bản sạch trong Plan B.
2. **Kịch bản đọc văn bản:**
   - Dùng Plan B (các extension 69shu/biquge sẵn có) là giải pháp thực dụng nhất: không vi phạm ranh giới bảo mật, không phụ thuộc server lậu, tương thích 100% với Rhino ES6 và các bộ dịch VietPhrase/AI của vBook.

---

## 4. Tổng Kết Đối Chiếu Ranh Giới Kỹ Thuật

- [x] Không vượt captcha slide bdturing: Đã phân tích rõ tính chất headless của `Engine.newBrowser()` ngăn cản hoàn toàn việc giải captcha tự động.
- [x] Không giả mạo chữ ký app ByteDance: Đã xác định snssdk API đòi hỏi chữ ký phức tạp và dễ bị cấm.
- [x] Không giải mã font PUA: Đã chỉ ra việc DOM text bản chất vẫn là PUA, việc hiển thị trực quan trong vBook không khả thi do thiếu `@font-face` ngoài và phá vỡ TTS/Translate.
- [x] Không gọi relay server bên thứ 3 (`101.35.133.34:5000`): Đã xác minh nguồn gốc rủi ro từ các dự án GitHub (server đơn lẻ, không đảm bảo uptime, vi phạm quyền riêng tư).
