# Mê Truyện Chữ Org (metruyenchu.org)

Extension đọc truyện chữ tiếng Việt trên **metruyenchu.org** — Tiên Hiệp,
Xuyên Không, Điền Văn, Ngôn Tình, Cổ Đại, Hài Hước... miễn phí, HTML tĩnh,
không chống bot, không cần mở khóa VIP.

## ⚠️ Không phải metruyenchu.com.vn

Repo đã có extension **"Mê Truyện Chữ"** cho `metruyenchu.com.vn`. Đã kiểm
chứng live 2026-11-11 rằng `.org` là **site độc lập, không phải mirror/clone**
của `.com.vn` (xem chi tiết ở `work/ext-review/METRUYENCHU-ORG-PROGRESS.md`):

- Backend khác: `.org` = Laravel (`XSRF-TOKEN` + `laravel_session`);
  `.com.vn` = ASP.NET (`x-aspnet-version: 4.0.30319`).
- URL chương khác: `.org` `/<slug>/chuong-<n>-<ten-chuong>` (đọc được);
  `.com.vn` `/<slug>/chuong-<n>-<token-ngau-nhien>`.
- Giao diện/asset khác hẳn (homepage 102.893B vs 69.247B; CSS/JS riêng).
- Kho truyện khác: 3/3 truyện mẫu của `.com.vn` 404 trên `.org`; 2/3 truyện
  mẫu của `.org` 302 về trang chủ trên `.com.vn` (không có truyện đó).
- Chỉ trùng tên thương hiệu "Mê Truyện Chữ" và 1 truyện phổ biến (Dẫn Chu Loan).

Vì vậy extension này đứng riêng, KHÔNG dùng `.com.vn` làm mirror.

## Cấu trúc site (kiểm chứng live 2026-11-11)

- **Kho nhỏ**: ~7 truyện (2026-11-11). Truyện hot / mới cập nhật / mới đăng:
  7 truyện; truyện full: 3 truyện; thể loại Tiên Hiệp: 1 truyện.
- **Danh sách**: `article.category-story-card` trong `#categoryStoriesGrid`
  (trang `/danh-sach/*`) hoặc `.category-stories-grid` (trang thể loại).
  Bìa `img[src]`, tên `a.category-story-title`, chương mới nhất
  `.category-story-chapter a`, lượt xem ở `.category-story-stats`.
  Phân trang bằng nút `#loadMoreStories` + `data-next-url` — hiện tại mọi
  trang mẫu đều có `data-next-url` rỗng (chỉ 1 trang).
- **Tìm kiếm**: API `GET /story/search?type=quick_search&str=<từ khóa>` trả
  về một chuỗi JSON chứa các thẻ `<a class='list-group-item'>`. Không có kết
  quả thì trả chuỗi rỗng (`""`). Kết quả không có bìa.
  LƯU Ý: trang `/tim-kiem?tukhoa=<kw>` trả cùng 1 danh sách cố định cho mọi
  từ khóa (kể cả từ vô nghĩa) — KHÔNG dùng được. POST `/story/search` → 405.
- **Thể loại**: 34 link `/the-loai/<slug>` trên trang chủ. Tên viết không nhất
  quán giữa các chỗ ("Tiên Hiệp" / "Tiên hiệp" / "dammy" vs "Đam Mỹ") nên
  genre.js gom theo slug, chọn text đẹp nhất rồi chuẩn hóa viết hoa đầu từ.
- **Chi tiết**: `/<slug>` — mọi thứ trong khối `#truyen` (nav/header cũng có
  link thể loại nên phải giới hạn trong `#truyen`): tên `h1.mt-title`, tác giả
  `a.mt-info-tag[href*='/tac-gia/']`, bìa `og:image`, mô tả `.mt-desc`, thể
  loại `a.mt-info-tag[href*='/the-loai/']`, trạng thái + số chương trong các
  hàng `<tr>` ("Tình trạng:" = "Đang ra" / "Full"; "Số chương:").
- **Mục lục**: SSR đầy đủ trong `#mt-chapters-list` (`li.chap-item a`), thứ
  tự tăng dần, KHÔNG phân trang (không cần `page.js`). Chương thiếu là do site
  xóa thật: "Cả Nhà Ta Đều Xuyên Không Tới" có 41 link, ch. 1–43 trừ 40, 42
  (fetch trực tiếp cũng 404).
- **Chương**: `/<slug>/chuong-<n>-<ten-chuong>` — nội dung trong
  `<div id="chapter-c">`, tiêu đề `h1.chapter-reading-title`. Không thấy quảng
  cáo chèn trong nội dung chương mẫu.

## Truyện mẫu (test.json)

- **Cả Nhà Ta Đều Xuyên Không Tới** — tác giả "Đang Cập Nhật", Đang ra,
  41 chương; ch. 1 "Hù Chết Người", nhân vật Tống Phục Linh.
- **Dẫn Chu Loan** — tác giả Thanh Đồng Tuệ, Full, 237 chương.

## Kết quả test trên máy thật

(Điền sau khi test — xem `work/ext-review/METRUYENCHU-ORG-PROGRESS.md`.)
