# Wetruyen (wetruyen.com)

Extension đọc truyện chữ tiếng Việt trên **wetruyen.com** (tên cũ dtruyen.com)
— Tiên Hiệp, Kiếm Hiệp, Ngôn Tình, Xuyên Không, Huyền Huyễn, Đô Thị...
miễn phí, HTML tĩnh, không chống bot.

## Cấu trúc site (kiểm chứng live 2026-11-11)

- **Danh sách** (truyện hot / mới cập nhật / full / mới đăng / thể loại / tìm
  kiếm): `.row[itemtype="https://schema.org/Book"]`, 25/trang. Bìa trong
  `div.lazyimg` (`data-desk-image` ưu tiên, `data-image` dự phòng — không có
  thẻ `<img>`). Tên `h3.truyen-title a`, tác giả
  `span.author[itemprop=author]`, số chương ở `span.author` thứ hai.
  Phân trang danh sách dạng `<base>trang-N/`; tìm kiếm dạng `&paged=N`.
- **Tìm kiếm**: GET `/tim-kiem/?tukhoa=<từ khóa>`. "kiem lai" → 1 kết quả
  (Kiếm Lai); "kiem" → 274 kết quả.
- **Thể loại**: 42 link `/truyen-<slug>/full/` trong menu trang chủ; `/full/`
  là canonical (không-`/full/` 301 về `/full/`).
- **Chi tiết**: `/<slug>.<id>/` — tên `h1.title`, tác giả
  `.info a[itemprop=author]`, bìa `.books img[itemprop=image]`, thể loại
  `.info a[itemprop=genre]`, mô tả `.desc-text[itemprop=description]`;
  trạng thái + tổng số chương trong meta description
  ("…số chương 311 tình trạng Đang ra.").
- **Mục lục phân trang**: `/<slug>.<id>/trang-N/`, 50 chương/trang. Trang 1
  có 2 khối chương ("Các chương mới nhất" + `#list-chapter`) —
  toc.js chỉ lấy khối `#list-chapter`. `page.js` tính số trang từ tổng số
  chương (ceil(tổng/50)).
- **Chương**: `/<slug>/chuong-<n>.html` — nội dung trong `<div id="chapter-c">`,
  tiêu đề chương là `h1 a.chapter-title`.

## Vòng đời

home (4 tab tĩnh) / genre (42 thể loại) / book (renderer danh sách chung) /
search / detail / toc / page / chap. Dùng `pacedFetch` (lib/rate-limit.js)
để pacing chống rate-limit trước mỗi request.

## Truyện mẫu (test.json)

Cắn Nuốt Trời Cao (Duy Ái Văn Thanh) — 311 chương, 7 trang TOC.
Tìm "kiếm lai" → Kiếm Lai; chương 1 mở đầu "Thiên huyền đế quốc…".

## Ghi chú

- Icon 200x200 render từ apple-touch-icon thật của site
  (`cdn.wetruyen.com/apple-touch-icon-1.png`, logo "Tc" xanh).
- Không có mirror: dtruyen.com 301 về wetruyen.com (cùng site).
- Kho truyện có thể trùng nhiều với truyenfull.link (cùng mẫu + cùng dòng
  truyện dịch TQ), nhưng là domain riêng — thêm dự phòng.
