# Mê Truyện Hot VN (metruyenhotvn.com)

Extension đọc truyện chữ tiếng Việt trên **metruyenhotvn.com** — Tiên Hiệp,
Huyền Huyễn, Ngôn Tình, Đam Mỹ, Đô Thị, Tổng Tài... miễn phí, toàn văn,
không chống bot, không cần mở khóa VIP. Tên cũ của site: metruyenhot.vn
(301 về metruyenhotvn.com).

## Cấu trúc site (kiểm chứng live 2026-11-11)

- **46 thể loại** (`/the-loai/<slug>/`), danh sách `/danh-sach/truyen-hot/`,
  `/danh-sach/truyen-full/`, `/danh-sach/truyen-moi-cap-nhat/`... Phân trang
  `?page=N` (nút `li.next`).
- **Danh sách**: `table.list-story-show`, mỗi hàng `<tr>`: bìa `td.image
  img[data-src]` (lazyload, host `img.metruyenhotvn.com`), tên
  `h3.rv-home-a-title a`, chương mới nhất `td.chap.pc a`, điểm `.rate`.
- **Chi tiết** `/<slug>/`: tên `h1.title a`, tác giả
  `span[itemprop=author]`, bìa `img.lazyload[data-src]`, thể loại
  `span[itemprop=genre]`, trạng thái `span.status`, mô tả `.content1`.
  Trang chi tiết chỉ hiện ~55 chương mới nhất.
- **Tìm kiếm — endpoint thật là API gợi ý**: `GET
  /ajax/suggest-story?q=<từ khóa>` trả JSON `[{name, url}]` (autocomplete
  của ô tìm kiếm trên site). LƯU Ý: form tìm kiếm `/tim-truyen?q=<kw>`
  trả về trang chủ rỗng với mọi từ khóa (kể cả từ khóa có thật), POST
  `/tim-truyen` trả 500 — KHÔNG dùng được. `q=kiem lai` trả `[]` (site
  không có Kiếm Lai); `q=long than` trả 5 kết quả đúng.
- **Mục lục — API riêng**: `GET /ajax/list-chapter?story=<slug>&chapter=1`
  trả JSON `{status: 200, html: "<select><option
  value=\"/slug/chuong-N/\">N</option>..."}` — toàn bộ chương trong 1 lần
  gọi (Long Thần Thượng Cổ: 272 chương), không phân trang nên KHÔNG có
  `page.js`.
- **Chương** `/<slug>/chuong-<n>/`: nội dung trong `<div class="chapter-c">`
  (các đoạn `<p>`), tiêu đề `h1 .rv-chapt-title a`. Chương 1 Long Thần
  Thượng Cổ: ~12.281 ký tự.
- **Trạng thái**: lấy theo trường "Trạng thái" của site. Lưu ý hậu tố
  "(FULL)" trong tên truyện KHÔNG tin cậy — Long Thần Thượng Cổ có
  "(FULL)" trong tên nhưng site vẫn ghi "Đang ra" và không nằm trong danh
  sách Truyện Full.

## Truyện mẫu (test.json)

- Long Thần Thượng Cổ - Tư Tuyết Y (FULL) — Y Lan, Đang ra, 272 chương.
- Đặc Công Chí Tôn - Tần Dương — Hoa Tiến Tưu, Đang ra, 798 chương.

## Ghi chú kỹ thuật

- Icon dựng từ favicon thật của site (ngọn lửa trắng/vàng trên nền tối),
  200x200.
- Pacing theo AGENTS.md §6.11: mọi request qua `pacedFetch()`
  (file rate-limit.js), 1 request/lần, backoff 429/405/503 tối đa 3 lần.
- Không có mirror biết được (metruyenhot.vn cũ đã 301 về domain này).
