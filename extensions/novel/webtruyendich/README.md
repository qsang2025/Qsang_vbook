# Web Truyện Dịch (webtruyendich.com)

Đọc truyện dịch tiên hiệp, huyền huyễn trên webtruyendich.com — bản dịch
Vietphrase (xem mục "Bản dịch chương" bên dưới).

## Khảo sát site (2026-11-12, từ VM + máy thật)

- Trang chủ, trang chi tiết, trang thể loại, API tìm kiếm: HTTP 200.
- API chính: `GET /api/search-novels?keyword|sort|page` → JSON
  `{novels: [...], page, total_pages, total_novels, novels_per_page}`,
  20 truyện/trang. Mỗi truyện: `title, author, description,
  thumbnail (/api/thumb/...), url (slug), genre_name, created_at,
  update_date`. Tham số `sort` đổi thứ tự thật (đã kiểm chứng:
  update, view-weekly, view-monthly, push-weekly, push-monthly,
  ban-chay). Riêng `sort=chi-so-doc` trả đúng thứ tự mặc định —
  nhiều khả năng API bỏ qua tham số này; tab "Bảng Xếp Hạng Đọc"
  vẫn giữ để test trên máy so sánh.
- **API bỏ qua tham số `genre`**: `?genre=huyen-huyen` trả đúng danh
  sách mặc định (cùng 20 truyện, cùng thứ tự với `?sort=update`).
  Vì vậy danh sách thể loại đọc từ trang HTML của thể loại
  (`/the-loai/<slug>?page=N`, render sẵn 20 truyện dạng
  `article.novel-card`, phân trang bằng link `?page=N`).
- Chi tiết truyện: `h1` (có tiền tố "Truyện " cần cắt), `meta
  book:author`, `meta og:image` (ảnh bìa host trên jsdelivr
  `cdn.jsdelivr.net/gh/truyendichai/TruyenDichAi@main/thumb/...`),
  mô tả ở `div.novel-description-content`, trạng thái ở badge
  `span.bg-emerald-500/10`, số chương ở hàng thống kê
  (`p.text-xl.sm:text-2xl` đầu tiên, hoặc chuỗi "Với N chương"),
  thể loại ở link `/the-loai/` trong khối `.flex.flex-wrap.gap-2`,
  chương mới nhất ở `#latest-chapters-list`.
- Mục lục: `GET /api/novels/{id}/chapters?source={source}&limit=10000`
  → 1.814 mục trong 1 lần gọi (mẫu Cẩu Tại Võ Đạo Thế Giới Thành
  Thánh, `novel_id` 3811, nguồn mặc định `sudugu`, `total_pages` 1).
  Có 6 URL trùng — `toc.js` dedupe theo URL còn 1.808 mục duy nhất.
  Trang chi tiết chỉ hiện 3 chương mới nhất + link
  `/danh-sach-chuong-day-du`, nên không có `page.js` (mục lục không
  phân trang).
- **Cloudflare**: trang chương (`/truyen/<slug>/<source>/chuong-...`)
  và `POST /api/getChapter` bị challenge "Just a moment..." (HTTP
  403) từ IP datacenter của VM — IP VM còn bị cắt kết nối (HTTP 000)
  sau nhiều lần thử. Các trang còn lại (chủ, chi tiết, thể loại, API
  tìm kiếm/mục lục) không bị chặn. Trên máy thật, `fetch` của app
  dùng chung cookie trình duyệt nên có thể qua được nếu người dùng
  đã xác minh Cloudflare trong trình duyệt của app một lần (mẫu
  novels.com.tw). `chap.js` báo lỗi tiếng Việt rõ ràng khi gặp 403
  và hướng dẫn làm việc này.

## Bản dịch chương

`chap.js` POST `/api/getChapter` với `translator: "Vietphrase"` —
nội dung trả về là **bản Vietphrase (convert)**, đúng mô tả của bản
gốc kychi v2 ("V1: chỉ load được vietphrase (convert)"). Chưa kiểm
chứng trực tiếp kiểu văn bản từ VM do Cloudflare chặn; kết quả test
trên máy thật sẽ ghi rõ ở đây sau khi chạy (xem mục "Kết quả test").

## Thay đổi so với bản gốc kychi v2

- `author` đổi thành `MuseAi` (theo quy tắc nhà §11); ghi nhận kychi
  ở đây và trong `description` của `plugin.json`.
- `config.js` viết lại: override từ `DOMAIN` (chuẩn nhà) thay cho
  `CONFIG_URL`; bỏ `CONFIG_UA`/`CONFIG_AI` (không có config tương
  ứng trong `plugin.json` nên không bao giờ được inject); bỏ
  User-Agent cố định — fetch dùng UA mặc định của runtime (quy tắc
  10, giữ `cf_clearance` hiệu lực); thêm `safeFirst()` (quirk
  `.first()` không bao giờ trả null) và `fetchPage()` có pacing.
- `detail.js` sửa 3 selector sai của bản gốc: số chương (bản gốc lấy
  `.text-xl.font-bold` — đó là tiêu đề "Đề cử truyện"), trạng thái
  (bản gốc lấy `.bg-green-100` — không tồn tại), mô tả (bản gốc lấy
  `.lg:col-span-2 p` — không tồn tại); bỏ `return null`, trả
  `Response.error` tiếng Việt; thêm `url`, `type: "novel"`,
  `format: "novel"`; cắt tiền tố "Truyện " ở `h1`.
- `gen.js` viết lại: thêm chế độ đọc HTML cho trang thể loại (API bỏ
  qua `genre`); API chỉ dùng cho tab trang chủ/xếp hạng/tìm kiếm.
- `toc.js`: lấy `novel_id`/`defaultSource` từ `doc.html()` (1 lần
  parse, tránh đọc body 2 lần); lỗi trả `Response.error`; dedupe URL.
- `chap.js`: lấy tiêu đề chương từ `h1` làm tham số thứ 2 của
  `Response.success`; thêm xử lý 403/429/405 với thông báo tiếng Việt.
- Thêm pacing (`rate-limit.js` vào `src/`, gọi trước mỗi request),
  `test.json`, `health.json`; bỏ `page.js` (mục lục không phân trang);
  icon resize về 200x200.
- `gen.js` có trong script map (`"gen": "gen.js"`) vì các tab trỏ
  tới nó.

## Kết quả test

Test trên máy thật (HONOR PTP-AN10, 2026-11-12 ~19:2x, log
`work/ext-review/webtruyendich-device-test.log`): **8/9 case code 0**.

- home.js: 7 tab đúng.
- genre.js: 12 thể loại đúng.
- gen.js `/the-loai/huyen-huyen`: 20 truyện, đầu "Thôn Thiên Hỗn
  Độn Kinh", bìa `/api/thumb/...`, mô tả "Huyền Huyễn" — chế độ
  đọc HTML thể loại chạy tốt.
- gen.js `/tim-truyen?sort=update`: 20 truyện, đầu "Toàn Chức
  Quốc Y".
- gen.js `/xep-hang/chi-so-doc`: 20 truyện; 2 truyện đầu giống
  `sort=update` nhưng truyện thứ 3 khác ("Ngã Tại Pháp Lan Tây
  Đương Vương Thái Tử" thay cho "Hoàng Phi Đến Từ Địa Phủ...") →
  `sort=chi-so-doc` CÓ tác dụng, giữ tab.
- search.js "cẩu tại": 20 kết quả, truyện mẫu đứng thứ 2 — tìm
  kiếm theo từ khóa chạy.
- detail.js: tên (đã cắt "Truyện "), tác giả, Đang ra, Số chương
  1814, Chương mới ch.985, thể loại Huyền Huyễn, mô tả đúng.
- toc.js: 1.808 mục (dedupe từ 1.814), ch.1 → ch.985 đúng thứ tự.
- **chap.js: code 1 — trang chương bị Cloudflare chặn (HTTP 403)
  cả trên máy thật.** Probe thêm: `POST /api/getChapter` không
  cần `chapter_id` cũng 403 từ máy thật → Cloudflare chặn cả 2
  đường lấy nội dung chương, không phải do thiếu `chapter_id`.
  Cách xử lý (mẫu novels.com.tw): mở truyện trong trình duyệt
  của app một lần để qua xác minh Cloudflare, cookie
  `cf_clearance` sẽ được `fetch` dùng chung → đọc lại chương.
  Chưa thử lại sau khi qua challenge; bản dịch Vietphrase vẫn
  chưa xác nhận bằng mắt (xem "Bản dịch chương").
- Validate: PASS 33 nguồn, 0 cảnh báo.
- Cài lên máy: `[install] OK code=200`.

## Điểm còn mở

- **Đọc chương cần qua Cloudflare 1 lần trong trình duyệt của
  app** (xem trên). Sau khi qua, test lại `chap.js` ch.1 để xác
  nhận nội dung Vietphrase + tốc độ.
- Bìa `cdn.jsdelivr.net/...` và `webtruyendich.com/thumb/...`
  chưa xác nhận bằng mắt trong app (bìa chi tiết trả về là
  `webtruyendich.com/thumb/...`, khác với `og:image` jsdelivr
  thấy từ VM — site có thể xoay CDN).
- Chỉ test 1 truyện mẫu (Cẩu Tại Võ Đạo Thế Giới Thành Thánh,
  1.814 chương, Đang ra); truyện ngắn/đã hoàn thành chưa test.
- Trang thể loại trang 2+ chưa chạy trên máy (mới thấy link phân
  trang trong HTML).
