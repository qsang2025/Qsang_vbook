# TruyenDich.AI — extension vBook cho truyendich.space

Đọc truyện dịch AI & Convert. Port từ bản v5 của **hieu05** (fork
`yae-miko-313`), chỉnh cho đúng quy tắc nhà Qsang_vbook.

## Domain

- Mặc định: **https://truyendich.space** (kiểm chứng 2026-11-12: `.store`
  redirect 301 sang `.space`; `.ai` redirect sang `.fit`; cả ba cùng một
  backend, API giống hệt nhau).
- Dự phòng trong cài đặt nguồn (DOMAIN, dạng select): `.store`, `.fit`.
- Regexp cover cả `.space`, `.store`, `.ai`, `.fit`.

## Cách hoạt động

- **Danh sách (home/genre):** API chính thức — `GET /api/lists/<ten>?page=&size=20`
  (truyen-hot, truyen-moi, truyen-full, truyen-convert, truyen-dich,
  truyen-dich-ai) và `GET /api/categories/<slug>?page=&size=20`.
- **Thể loại:** trang `/the-loai` trả 404 nên đọc từ trang chủ (đủ 20 thể
  loại); nếu fetch lỗi thì dùng danh sách cứng đã kiểm chứng khớp site.
- **Tìm kiếm:** scrape HTML `/tim-kiem?q=&page=` (thẻ `main a.group`,
  tiêu đề trong `h3`).
- **Chi tiết:** scrape HTML `/doc-truyen/<slug>` (tên trong `main header h1`,
  thông tin Tác giả/Số chương/Trạng thái/Cập nhật, mô tả trong `section .prose`,
  bìa `/anh-bia/*.webp`). Thể loại hiện dạng chip ở trường `genres`.
- **Mục lục:** 50 chương/trang, URL `/trang-N`; trang chi tiết chỉ chứa
  50 chương đầu + 6 chương mới nhất nằm NGOÀI section chương nên `toc.js`
  chỉ lấy link trong `section:has(h2:contains(Danh sách chương))` — không
  trùng lặp giữa các trang.
- **Chương:** `section.prose-novel` (bản dịch AI/Vietphrase). Mỗi truyện có
  thể có 2 phiên bản: bản gốc (đường dẫn `/doc-truyen/<slug>`, thường chính
  là bản AI) và Convert (`/doc-truyen/cv/<slug>`), hiện ở mục "Các bản dịch
  khác" trên trang chi tiết (script `edition.js`).
- **Pacing:** mọi request qua `fetchPage` (config.js, jitter 500–1500ms) hoặc
  `pacedFetch` (API, backoff tối đa 3 lần + cooldown 429/405).

## Khác biệt so với bản gốc

- Domain mặc định `.store` → `.space`; thêm `.fit` dự phòng.
- Vá quirk runtime `.first()` không bao giờ trả null (dùng `safe-first.js`)
  ở `chap.js` (chuỗi fallback nội dung), `toc.js` và `page.js`.
- `detail.js`: thể loại chuyển từ `tags` (không hiển thị) sang `genres`.
- `gen.js`/`edition.js` khai báo vào script map (bản gốc thiếu → validate
  báo file mồ côi); `genre.js` đọc thể loại từ trang chủ thay vì `/the-loai`
  (404).
- Author đổi thành `MuseAi` theo quy tắc nhà; attribution giữ ở đây và
  trong `description` của plugin.json.
