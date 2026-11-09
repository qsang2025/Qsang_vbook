# Kế hoạch phát triển: Extension Qimao (七猫免费小说) — vBook

- **Ngày lập**: 2026-11-09
- **Nhánh thực hiện**: `feature/qimao-ag` (Repo: `/home/antigravity/qsang2025/Qsang_vbook`)
- **Tác giả quy định**: `"author": "MuseAi"` (Bản đối soát song song với Muse/Bẹp)
- **Loại extension**: `chinese_novel` | **Locale**: `zh_CN` | **Version**: 1
- **File ngữ cảnh**: `.agents/plans/qimao-extension-CONTEXT.md`

---

## 1. Mục tiêu (Goal)

Xây dựng hoàn chỉnh extension vBook nguồn truyện chữ tiếng Trung **Qimao (七猫免费小说 - qimao.com)** chất lượng cao, đầy đủ vòng đời 6 script chuẩn (`home`, `genre`, `gen`, `search`, `detail`, `toc`, `chap`), giải mã nội dung AES-128-CBC trực tiếp từ API gốc, đạt kiểm định `validate PASS (0 cảnh báo)`, đóng gói `plugin.zip` tự động, và sẵn sàng kiểm thử trên thiết bị thật qua Developer Server.

---

## 2. Ngữ cảnh & Ràng buộc kỹ thuật (Context & Constraints)

1. **Nhánh Git**: Toàn bộ thao tác chỉ chạy trên nhánh `feature/qimao-ag`. **Tuyệt đối không đụng vào `feature/qimao-muse`, không push lên `main`**.
2. **Quy tắc Rhino ES6**:
   - Chỉ dùng: `var`, `function`, nối chuỗi `+`.
   - Cấm: `let`, `const`, arrow functions `() =>`, template literals ````, `async/await`, `?.`, `??`, `...`, `.flat()`.
   - Cơ chế `load()`: Chỉ load file ở top-level `src/`, không đệ quy. `config.js` **không được gọi `load()`**. Các file script chính tự load `config.js` và `crypto.js` ở đầu file.
3. **API & Bảo mật**:
   - App di động Qimao dùng endpoint `api-bc.wtzw.com` (Book / Search) và `api-ks.wtzw.com` (TOC / Chap).
   - Muối ký MD5: `d3dGiJc651gSQ8w1`.
   - Khóa AES-128 nội dung chương: `32343263636238323330643730396531` (Hex của `"242ccb8230d709e1"`), IV là 32 ký tự Hex đầu của chuỗi giải mã Base64, chế độ `AES-128-CBC`, padding `Pkcs7`.
4. **Xử lý lỗi**: Trả về `Response.error("Thông báo tiếng Việt")`, không bao giờ `return null`.
5. **Dữ liệu thật**: Link truyện, ID sách, ID chương lấy 100% từ API thật, không tự tính toán hoặc bịa đặt.

---

## 3. Các bước thực thi chi tiết (Execution Steps)

### Cụm bước 1: Khởi tạo khung sườn, Manifest và Thư viện mã hóa
- **Step 0: Lưu và commit file Kế hoạch (Plan savepoint)**
  - Executor commit file Plan này trên nhánh `feature/qimao-ag` với thông điệp: `docs: initialize plan for qimao extension (feature/qimao-ag)`.
- **Step 1: Tạo thư mục extension và `plugin.json`**
  - Tạo `extensions/chinese_novel/qimao/`.
  - Khai báo `plugin.json` với `author: "MuseAi"`, `version: 1`, `type: "chinese_novel"`, `locale: "zh_CN"`, `source: "https://www.qimao.com"`, `regexp: "^https?://(www\\.)?qimao\\.com/shuku/\\d+/?$"`, script map đầy đủ.
  - Tải hoặc trích xuất `icon.png` chính thức của 七猫 (kích thước chuẩn, decodable, < 5MB).
  - *Xác minh*: Kiểm tra JSON hợp lệ qua `node -e "JSON.parse(fs.readFileSync('extensions/chinese_novel/qimao/plugin.json'))"`.
- **Step 2: Tạo `src/config.js` và inline `src/crypto.js`**
  - `src/config.js`: Khai báo `BASE_URL = "https://www.qimao.com"`, `API_BC_URL = "https://api-bc.wtzw.com"`, `API_KS_URL = "https://api-ks.wtzw.com"`, muối ký `API_SALT = "d3dGiJc651gSQ8w1"`, hàm ký request `signQuery(params)`, hàm tạo `buildHeaders()`, và các helper làm sạch văn bản `cleanHtml()`, `cleanText()`. Không có lệnh `load()`.
  - Sao chép `lib/crypto.js` vào `extensions/chinese_novel/qimao/src/crypto.js`.
  - *Xác minh*: Kiểm tra linter Rhino ES6 không báo lỗi cú pháp trên 2 file.

### Cụm bước 2: Triển khai các script Điều hướng (home, genre, gen, search)
- **Step 3: Triển khai `src/home.js` và `src/genre.js`**
  - `src/home.js`: Trả về mảng tab tĩnh (Nam sinh, Nữ sinh, Xuất bản, Phổ biến, Mới nhất) trỏ về `gen.js`, không fetch HTTP.
  - `src/genre.js`: Danh sách các thể loại truyện của Qimao (Nam: Huyền huyễn, Đô thị, Tiên hiệp, Lịch sử...; Nữ: Cổ đại ngôn tình, Hiện đại ngôn tình, Huyền ảo tu chân...).
  - *Xác minh*: Test chạy script trong sandbox Node Rhino ES6, kiểm tra cấu trúc mảng trả về.
- **Step 4: Triển khai `src/gen.js` (Phân trang danh mục)**
  - Nhận input từ `home.js` hoặc `genre.js` và tham số `page`.
  - Parse danh sách truyện từ `https://www.qimao.com/shuku/<filter>-update_time-<page>/` (hoặc API mobile tương ứng), trích xuất tên truyện, link `/shuku/<id>/`, ảnh bìa, tác giả, mô tả ngắn.
  - Xử lý phân trang chuẩn (trả về `next` là chuỗi số trang tiếp theo, hoặc rỗng khi hết).
  - *Xác minh*: Chạy thử nghiệm bóc tách dữ liệu trang 1 và trang 2.
- **Step 5: Triển khai `src/search.js` (Tìm kiếm truyện)**
  - Gọi API: `GET https://api-bc.wtzw.com/api/v7/search/words?wd=<keyword>&sign=<sign>`.
  - Trích xuất danh sách sách: `id`, `original_title`, `original_author`, `image_link`, `intro`, `is_over`.
  - Format link chuẩn `https://www.qimao.com/shuku/<id>/`.
  - *Xác minh*: Test tìm kiếm với từ khóa `"剑来"` và `"第一凤女"`.

### Cụm bước 3: Triển khai các script Đọc truyện (detail, toc, chap)
- **Step 6: Triển khai `src/detail.js` (Chi tiết truyện)**
  - Tách `book_id` từ URL (ví dụ `https://www.qimao.com/shuku/1803136/`).
  - Gọi API: `GET https://api-bc.wtzw.com/api/v5/book/detail?id=<book_id>&sign=<sign>`.
  - Parse: tên truyện, tác giả, ảnh bìa, tóm tắt (`intro`), trạng thái ra chương (`ongoing` / `completed`), thể loại, điểm đánh giá, số chương/chữ.
  - *Xác minh*: Test với book `1803136` và một đầu sách khác.
- **Step 7: Triển khai `src/toc.js` (Mục lục chương)**
  - Gọi API: `GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list?id=<book_id>&sign=<sign>`.
  - Parse toàn bộ danh sách chương: `name: item.title`, `url: BASE_URL + "/shuku/" + book_id + "/" + item.id + "/"`.
  - Đảm bảo ID chương là ID thật do API trả về, không tự tính toán.
  - *Xác minh*: Test với book `1803136` (kết quả mong đợi > 1000 chương).
- **Step 8: Triển khai `src/chap.js` (Nội dung chương & Giải mã AES)**
  - Tách `book_id` và `chapter_id` từ URL.
  - Gọi API: `GET https://api-ks.wtzw.com/api/v1/chapter/content?chapterId=<chapter_id>&id=<book_id>&sign=<sign>`.
  - Giải mã nội dung `data.content` qua AES-128-CBC với key `32343263636238323330643730396531` và IV lấy từ 32 ký tự Hex đầu.
  - Định dạng văn bản: làm sạch thẻ rác, bao bọc `<p>...</p>`, trả về `Response.success(content, title)`.
  - Xử lý trường hợp chương VIP/khóa hoặc chương lỗi: báo lỗi tiếng Việt rõ ràng, kèm hướng dẫn hoặc cơ chế fallback.
  - *Xác minh*: Giải mã thành công chương 1 của book `1803136`.

### Cụm bước 4: Fixtures, Đóng gói, Kiểm tra toàn vẹn và Báo cáo
- **Step 9: Tạo Fixtures kiểm thử (`test.json` & `health.json`)**
  - `test.json`: Khai báo các case kiểm thử cho `home`, `genre`, `search`, `detail`, `toc`, `chap` dựa trên dữ liệu thật của Qimao.
  - `health.json`: Khai báo endpoint probe cho CI check sức khỏe định kỳ.
- **Step 10: Đóng gói và Kiểm tra toàn diện**
  - Chạy `node scripts/cli.js build extensions/chinese_novel/qimao` để sinh `plugin.zip`.
  - Chạy `node scripts/cli.js build-catalog` để cập nhật registry gốc `plugin.json`.
  - Chạy `npm run validate` để linter Rhino ES6 và kiểm tra catalog đối chiếu. Bắt buộc: **PASS (0 cảnh báo)**.
- **Step 11: Tài liệu sáng tạo, Commit & Báo cáo**
  - Tạo `extensions/chinese_novel/qimao/README.md`: Ghi rõ cấu trúc kỹ thuật, giải thuật giải mã AES/MD5, ghi nhận ý tưởng xử lý chương VIP/khóa và mirror dự phòng.
  - Commit toàn bộ kết quả lên nhánh `feature/qimao-ag`.
  - Báo cáo chi tiết cho Master để sẵn sàng cài đặt test trên máy thật của anh Sáng qua Developer Server.

---

## 4. Quản lý Rủi ro & Phương án Dự phòng (Risks & Fallbacks)

| Rủi ro | Mức độ | Phương án xử lý |
|---|---|---|
| API Qimao đổi thuật toán ký MD5 | Trung bình | Đã xác thực muối ký `d3dGiJc651gSQ8w1` hoạt động ổn định trên phiên bản app 71900. Cấu hình tập trung tại `config.js` để dễ cập nhật. |
| Nội dung chương VIP bị mã hóa khác khóa | Thấp | Bắt lỗi trả về `Response.error("Chương yêu cầu mở khóa trong app 七猫")` hoặc hỗ trợ fallback sang nguồn mirror/aggregator tương ứng. |
| Vi phạm cú pháp Rhino ES6 | Thấp | Linter `validate.js` kiểm tra nghiêm ngặt trước khi đóng gói; mọi file đều được rà soát không chứa cú pháp hiện đại. |

---

## 5. Tiêu chí Hoàn thành (Definition of Done)

- [x] Nhánh git hiện tại là `feature/qimao-ag`.
- [x] Cấu trúc thư mục `extensions/chinese_novel/qimao/` đầy đủ 6 script + `config.js` + `crypto.js` + `icon.png` + `test.json` + `health.json` + `plugin.zip` + `README.md`.
- [x] `plugin.json` có `"author": "MuseAi"`, `"version": 1`.
- [x] `node scripts/cli.js validate` trả về **PASS (0 cảnh báo)**.
- [x] `node scripts/cli.js build-catalog --check` khớp 100%.
- [x] Tiến độ được ghi lại đầy đủ trong file này.

---

## 6. Tiến độ thực hiện (Progress Log)

*Executor cập nhật phần này sau mỗi bước thực hiện:*

- **2026-11-09**: Recon hoàn tất (bước 1 & 1.5). Đã tạo branch `feature/qimao-ag`. Master đã lập và duyệt kế hoạch.
- **2026-11-09 (Cluster 1)**: Hoàn thành Step 0, Step 1, Step 2. Đã commit Plan trên branch `feature/qimao-ag`. Đã khởi tạo thư mục `extensions/chinese_novel/qimao/`, tạo `plugin.json` chuẩn (`author: "MuseAi"`, `version: 1`), sao chép `icon.png` chính thức, tạo `src/config.js` chuẩn (không có `load()`, hỗ trợ `signQuery` & `buildHeaders`), và inline `src/crypto.js` từ `lib/crypto.js`. Đã kiểm định linter Rhino ES6 sạch 0 lỗi.
- **2026-11-09 (Cluster 2)**: Hoàn thành Step 3, Step 4, Step 5. Đã triển khai đầy đủ `src/home.js` (6 tab tĩnh: Nam sinh, Nữ sinh, Mới cập nhật, Xuất bản), `src/genre.js` (122 thể loại Nam/Nữ/Xuất bản trích xuất từ NUXT categories chính thức), `src/gen.js` (phân trang danh mục chuẩn từ thư viện web `qimao.com/shuku/`, bóc tách sách sạch, hỗ trợ phân trang `next`), và `src/search.js` (tích hợp Native App API v7, ký `signQuery` MD5, lọc bỏ show_type lạ, bóc tách sách, hỗ trợ phân trang). Đã kiểm thử độc lập thành công trong sandbox tương thích Rhino ES6, linter 0 cảnh báo.
- **2026-11-09 (Cluster 3)**: Hoàn thành Step 6, Step 7, Step 8. Đã triển khai đầy đủ `src/detail.js` (lấy chi tiết truyện sạch từ Native API v5 `api-bc.wtzw.com`, ánh xạ đầy đủ tên, tác giả, ảnh bìa, tóm tắt, trạng thái ongoing, thể loại/số chữ), `src/toc.js` (lấy toàn bộ mục lục chương thật qua API v1 `api-ks.wtzw.com`, trích xuất ID chương thật dạng 17084124930001, test book 1803136 đạt 1.130 chương, book 143170 đạt 1.279 chương), và `src/chap.js` (giải mã AES-128-CBC với key `32343263636238323330643730396531`, IV lấy từ 32 ký tự Hex đầu, xử lý sạch sẽ đoạn văn bọc `<p>...</p>`, loại bỏ rác/quảng cáo, bắt lỗi và thông báo tiếng Việt khi cần mở khóa VIP). Kiểm thử sandbox độc lập chạy trơn tru cả 2 đầu sách mẫu, linter Rhino ES6 sạch 0 cảnh báo.
- **2026-11-09 (Cluster 4)**: Hoàn thành Step 9, Step 10, Step 11. Đã tạo `test.json` (Golden fixture 7 case cho toàn bộ script dựa trên dữ liệu thật của 第一凤女 và 剑来), tạo `health.json` (CI probe nhẹ 3 case kiểm tra domain qimao.com và danh mục), chạy build `plugin.zip` tự động (30.752 bytes), cập nhật registry `plugin.json` ở root repo (19 nguồn), kiểm định `validate` đạt PASS tuyệt đối (0 cảnh báo), `build-catalog --check` khớp 100% với đĩa. Đã soạn thảo tài liệu kỹ thuật chuyên sâu và ý tưởng sáng tạo trong `extensions/chinese_novel/qimao/README.md` (giải trình MD5 signing, AES-128-CBC dynamic IV, cơ chế fallback kho raw mở cho chương VIP/khóa, cơ chế failover mirror, và phân tích các rào cản kỹ thuật). Sẵn sàng đẩy code lên remote branch `feature/qimao-ag`.

---

## 7. Các Quyết định của Master (Decisions Log)

- **Quyết định 1 (2026-11-09)**: Lựa chọn khai thác trực tiếp Native App API của 七猫 (`api-bc.wtzw.com` và `api-ks.wtzw.com`) thay vì chỉ cào web tĩnh, vì API trả về dữ liệu JSON có cấu trúc sạch, tốc độ dưới 100ms, không bị chặn bởi WAF, và cung cấp mục lục chương thật đầy đủ nhất.
- **Quyết định 2 (2026-11-09)**: Đặt `"author": "MuseAi"` theo đúng chỉ đạo của người dùng để phục vụ so sánh song song với bản của Bẹp trên nhánh `feature/qimao-ag`.
- **Quyết định 3 (2026-11-09)**: Tách thực thi thành 4 Cụm bước tuần tự, mỗi cụm chạy bởi 1 Sub-agent Flash theo đúng nguyên tắc `quota-workflow`.
