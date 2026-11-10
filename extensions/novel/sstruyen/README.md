# SS Truyện (sstruyen.net)

Extension đọc truyện chữ tiếng Việt trên **sstruyen.net** — truyện Ngôn Tình,
Xuyên Không, Trọng Sinh, Cổ Đại, Huyền Huyễn, Đô Thị... miễn phí, HTML tĩnh.

## Cấu trúc site (kiểm chứng live 2026-11-10)

Site đã redesign hoàn toàn so với bản cũ (sonzin v3 dùng `sstruyen.com.vn` —
domain này đã chết; ghi chú 2026-11-07 về `.truyen-list` cũng đã lỗi thời):

- **Danh sách** (tìm kiếm / thể loại / truyện mới / hot / hoàn thành):
  `article.archive-story-card`, 20/trang, phân trang dạng `/page/N`.
- **Tìm kiếm**: `/search?s=<từ khóa>` (canonical; `/tim-kiem?s=` vẫn chạy
  nhưng phân trang trỏ về `/search/page/N`).
- **Chi tiết**: `/truyen/<slug>` — tên `h1.story-title`, tác giả
  `a[href*='/tac-gia/']`, bìa `og:image`, thể loại `a[itemprop=genre]`,
  mô tả `.short-content`; trạng thái + tổng số chương trong meta description
  ("…Hoàn thành - Full với tổng số 295 chương…"); có JSON-LD `Book` dự phòng.
- **Mục lục phân trang**: `/truyen/<slug>/page/N`, 20 chương/trang. Trang 1
  có 2 khối `ul.list-chapter` ("Chương mới nhất" + `#list-chapter`) —
  toc.js chỉ lấy khối `#list-chapter`. `page.js` tính số trang từ tổng số
  chương (ceil(tổng/20)).
- **Chương**: `/truyen/<slug>/chuong-N` — nội dung trong
  `<div class="chapter-content">`, tiêu đề chương là `h1` đầu tiên.

## Vòng đời

home (4 tab tĩnh) / genre (41 thể loại) / book (renderer danh sách chung) /
search / detail / toc / page / chap. Dùng `pacedFetch` (lib/rate-limit.js)
để pacing chống rate-limit trước mỗi request.

## Truyện mẫu (test.json)

Cửu Trọng Tử (Chi Chi) — 295 chương, 15 trang TOC.
Tìm "cửu trọng tử" → truyện này; chương 1 mở đầu "Đậu Chiêu cảm thấy…".

## Ghi chú

- Icon 200x200 render từ logo SVG thật của site
  (`/assets/images/site-logo.svg`, phần mark sách + sao).
- Không có mirror: `sstruyen.com.vn` đã chết (kiểm chứng 2026-11-10).
