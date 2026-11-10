# XTruyện (xtruyen.vn)

Extension đọc truyện chữ tiếng Việt trên xtruyen.vn.

## Tính năng

- Trang chủ: 4 tab — Mới cập nhật, Xem nhiều, Truyện Full, Đang hot.
- Thể loại: 41 thể loại (Tiên Hiệp, Kiếm Hiệp, Ngôn Tình, Đam Mỹ, Đô Thị, Huyền Huyễn...).
- Tìm kiếm theo từ khóa, xem chi tiết, mục lục, đọc chương.

## Cơ chế đọc chương (Headless WebView)

Site đã bỏ cơ chế cũ (xem mục "Cơ chế cũ data_x" bên dưới): trang chương
hiện chỉ chứa một spinner trong `#chapter-reading-content`. Nội dung nằm
trong `window.readingChapterConfig.encodedData` (chuỗi base64url ~11 KB
cho một chương) và được file JS của site (`reading-page.js`, đã obfuscate)
giải mã bằng pako rồi chèn vào DOM sau khi tải trang. Không có request
AJAX riêng nào cho nội dung chương (đã kiểm chứng bằng `browser.urls()`:
chỉ có đúng 1 URL không phải asset tĩnh — chính trang chương).

Vì vậy `chap.js` đọc chương qua **Headless WebView** (`Engine.newBrowser`,
theo hợp đồng `extension-api.md`):

1. Fetch tĩnh trước (nhanh): lấy tiêu đề + thử `data_x` cũ / DOM tĩnh.
2. Nếu chưa có nội dung: mở trang bằng WebView, `browser.html(2000)`
   kiểm tra mỗi 2 giây (tối đa ~12 giây) cho tới khi
   `#chapter-reading-content` có nội dung thật, rồi lọc bằng `cleanHtml`.
3. Site render mỗi đoạn bằng `<div>` nên phải đổi `</div>` thành `<br>`
   trước khi `cleanHtml` (không thì các đoạn dính liền nhau).

Nhược điểm: mỗi chương mất thêm ~10 giây (mở WebView + chờ JS). Đây là
cách duy nhất đã xác minh được trên máy thật; giải mã trực tiếp
`encodedData` chưa làm được (xem dưới).

### Vì sao chưa giải mã trực tiếp được encodedData

Đã thử offline (Node, chuỗi `encodedData` thật của chương 50):

- Base64url chuẩn → 8.201 byte, đầu `89 68 d7 84 ba cc ec b8` — không phải
  zlib/raw-deflate/gzip, không phải UTF-8 thuần.
- Base64 với bảng chữ cái tùy chỉnh cũ (`URL64`) → cũng không inflate được.
- XOR 1 byte (0–255), XOR từ khóa (`xtruyen`, `chapter`, mã truyện/chương),
  đảo ngược byte, bỏ 1–2 byte đầu — đều không inflate được.
- Kết luận: dữ liệu đã bị mã hóa/xáo trộn thêm một lớp trước (hoặc sau) khi
  nén; khóa/thuật toán nằm trong `reading-page.js` đã obfuscate (82 KB,
  string-array + control-flow flattening) nên chưa trích ra được trong
  thời gian làm extension này. Nếu sau này giải được, `chap.js` có thể
  thêm đường fetch trực tiếp nhanh hơn và giữ WebView làm dự phòng.

## Cơ chế cũ data_x (không còn trên site, giữ làm dự phòng)

Biến JS `data_x` (Base64 với bảng chữ cái tùy chỉnh + DEFLATE thô) từng
chứa nội dung chương. Bộ giải nén JS thuần `src/inflate.js` (~270 dòng,
Huffman canonical kiểu puff.c, hỗ trợ block stored/fixed/dynamic, giới
hạn 10 MB, lỗi khi dữ liệu cắt ngang — không treo) vẫn giữ trong
extension để dự phòng nếu site trả lại `data_x`. Đã kiểm chứng offline
bằng Node `zlib.deflateRawSync`: round-trip PASS cho chương ngắn/dài
(36 KB giải nén trong ~15 ms), block stored, dữ liệu giả ngẫu nhiên 5 KB,
dữ liệu cắt ngang ném lỗi thay vì treo.

## Mục lục (API của site)

Site không liệt kê chương trong HTML trang chi tiết; mục lục lấy qua:

```
POST {BASE_URL}/api/api-chapters.php
  header X-Custom-Auth: abC0000011111
  body: manga_id=<id>&from=<đầu>&to=<cuối>&vol=
```

Trả JSON `[{s: slug, n: tên chương, e: mô tả thêm}]`. Lấy từng khoang
100 chương cho tới khi khoang trả ít hơn 100 hoặc rỗng. Mã truyện
(`manga_id`) đọc từ `data-post="..."` trong HTML trang chi tiết.

## Lưu ý

- Site có Cloudflare: lần đầu có thể cần mở trang xtruyen.vn trong trình
  duyệt của app vBook và qua xác minh, sau đó extension dùng chung cookie.
- Pacing: 1 request/lần/host, gọi `rateLimitDelay()` trước mỗi request
  (quy tắc nhà §6.11).
- Chỉ 1 domain (`https://xtruyen.vn`), chưa có mirror.

## Attribution

- Tìm kiếm/thể loại/chi tiết/mục lục: tham khảo extension xtruyen v3 của
  sonzin (repo `vbook-extension_sonzin`, không có LICENSE) — viết lại
  hoàn toàn theo phong cách Qsang_vbook (Response.error tiếng Việt,
  pacing, challenge-handler, cấu trúc file chuẩn repo). Lưu ý: sonzin v3
  đã lỗi thời ở 2 chỗ — trang tìm kiếm không còn dùng `.c-tabs-item`
  (nay dùng `.popular-item-wrap` như trang danh sách) và chương không còn
  `data_x`.
- Bộ inflate JS thuần: viết mới cho extension này (theo thuật toán
  DEFLATE chuẩn, tham khảo cấu trúc puff.c của Mark Adler, zlib license).

## Kiểm thử (trên máy thật, 2026-11-10)

- `test.json`: 7/7 case PASS — home (4 tab), genre (41 thể loại),
  search "độc chiến" (2 truyện), detail/toc `doc-chien-thien-nhai`
  (50 chương, ch.1 "Vô danh tiểu tử" → ch.50 "Hồn tán tinh không"),
  chap chương 50 (22.160 ký tự, mở đầu "Tống Mễ nói", kết "HẾT"),
  book tab Mới cập nhật (20 truyện, trang kế "2").
- Thêm: book qua thể loại Tiên Hiệp PASS (20 truyện).
- `health.json`: 4 case nhẹ cho CI (trang chủ, tìm kiếm, chi tiết, chương
  với pattern `encodedData` theo cơ chế hiện tại của site).
