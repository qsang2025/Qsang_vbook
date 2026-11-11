# QuyKhu — quykhu.com

Extension đọc truyện chữ tiếng Việt từ quykhu.com, nổi bật **Truyện Voz**
(truyện ma, tâm linh, tự truyện). Port từ **Vozer v6 của mizhm** (ref: mizhm),
chuẩn hóa theo quy tắc nhà Qsang_vbook (author MuseAi, locale vi_VN, type novel).

## Site (khảo sát 2026-11-11, từ VM)

- Trang chủ / chi tiết / tìm kiếm: HTTP 200 — **nhưng chỉ khi request có header
  `Accept-Language: vi-VN,vi;q=0.9`** (không có header thì 403, kể cả với UA
  trình duyệt). Mọi request trong extension đều đi qua `request()` trong
  `config.js` để gắn header này. Đây không phải challenge JS của Cloudflare.
- POST `/post/<id>/chapters` (mục lục) và trang chương (`/<slug>/chuong-<n>`)
  **bị treo (timeout) từ IP datacenter của VM** — kiểm chứng trên máy thật mới
  kết luận được; test máy là chứng cứ quyết định cho toc/page/chap.
- Mục lục: POST JSON `{page}` tới endpoint trong `[data-chapter-list]`
  (vd. `/post/624/chapters`), kèm `X-CSRF-TOKEN` lấy từ trang chi tiết
  (trang chủ render meta rỗng). Trang 2+ sinh từ mẫu link trang 1
  (endpoint giới hạn ~20 request/phút).
- Chương: URL/token nằm trong inline script (`contentUrl`, `contentToken`);
  nội dung trả về dạng JSON base64 đã XOR (khóa trong `payload.k`), giải mã
  bằng CryptoJS. Khách chỉ đọc được các chương đầu; server giải thích lý do
  trong `reason` khi bị chặn.
- Thể loại: site hiện chỉ có 2 mục (Voz, Giới Thiệu).
- vozer.io (domain cũ) đã chết (000 từ VM) — không có mirror dự phòng.

## Cấu trúc

- `config.js` — BASE_URL/DOMAIN, `request()` (Accept-Language + retry 429),
  `parseCards()`, CSRF + `postChapters()`, `chapterLinks()`, `chapterEndpoint()`,
  helper `qkFirst()` (quirk `.first()` của runtime).
- `home.js` — 5 tab tĩnh → `gen.js`. `genre.js` — 2 thể loại.
  `gen.js` — danh sách truyện theo tab/thể loại. `search.js` — GET /search.
- `detail.js` — tên, bìa, tác giả, mô tả (`.qk-post-content .smiley`),
  trạng thái Đang Viết/Hoàn thành, thể loại.
- `page.js` — danh sách URL các trang mục lục. `toc.js` — chương 1 trang
  (POST + fallback sinh từ mẫu). `chap.js` — nội dung chương (XOR decode).
- `rate-limit.js` — copy từ `lib/rate-limit.js` (pacing 500–1500ms trước mỗi
  request, theo quy tắc 11).

## Kiểm chứng

- Truyện mẫu: **Tụ Bảo Tiên Bồn** (Hương Quả Vị Nãi Trà, Đang Viết, Voz,
  2.333+ chương — link mới nhất `/tu-bao-tien-bon/chuong-2333`).
- Search `ma` → `Đôi Mắt Bồ Câu` đầu tiên.
