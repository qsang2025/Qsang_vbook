# App Truyện Chữ — apptruyenchu.pro (extension novel, Qsang_vbook)

Extension đọc truyện cho **https://apptruyenchu.pro** (App Truyện Chữ —
Truyện Dịch & Truyện Convert), viết mới hoàn toàn từ khảo sát site ngày
2026-11-06. Tác giả extension: Qsang.

## Nguồn tham khảo (attribution)

- Bản extension cùng nguồn của **ivanzzz (Ivan1hai/ext,
  `novel/apptruyenchu_ok`)**: toàn bộ file `src/*.js` của bản đó đã mã hóa
  (`encrypt: true`, không đọc được) nên **không dùng code** của bản đó.
  Chỉ tham khảo thông tin công khai: tên "App Truyện Chữ", nguồn
  `https://apptruyenchu.pro/`, mô tả "Next.js App Router + Firebase backend",
  và icon của app (file `icon.png` 64×64, là logo của chính site).
- Khung sườn, skill, template, lib dùng chung: Qsang_vbook (Darkrai9x làm
  chuẩn, xem `README.md` ở root repo).

## Site hoạt động thế nào (đã xác minh bằng trình duyệt, 2026-11-06)

- Next.js App Router. URL truyện: `/truyen/<slug>`; URL chương:
  `/truyen/<slug>/chuong-<số>-<slug-tên-chương>` (có truyện chương không có
  slug tên, vd `/chuong-1`, `/chuong-71`).
- **SSR (có trong HTML tải lần đầu, extension đọc trực tiếp được):**
  trang danh sách `/truyen` (20 truyện/trang, `?page=N`), tìm kiếm
  `/truyen?keyword=...`, thể loại `/truyen?cate=<slug>` (31 thể loại),
  trang chi tiết (h1, tác giả, trạng thái, thể loại, số chương, mô tả,
  ảnh bìa qua proxy `/_next/image?url=<ảnh-gốc>`), nội dung chương
  (`<article>` trong `<main>`).
- Thẻ truyện là một `<a href="/truyen/<slug>">` bao trọn `<img>` (alt = tên
  đầy đủ), `<h3>` tên truyện, div tác giả, div "N ch · X★". Site render 2
  bản mobile/desktop nên cùng một thẻ/link có thể xuất hiện 2 lần trong
  DOM — code đã khử trùng theo link.
- Ảnh bìa: bóc URL gốc từ tham số `url=` của `/_next/image` (CDN
  `cdn.truyenonl.net`, `s2.ttyapi.site`).

## Giới hạn đã biết — mục lục (toc)

**Danh sách chương KHÔNG có trong HTML tải lần đầu.** Trang chi tiết chỉ
có 2 link chương trong HTML: nút "Đọc truyện" (chương 1) và link "Chương
mới nhất" (chương cuối). Danh sách đầy đủ được tải bằng JavaScript phía
client từ một API/Firebase ẩn — đã thử nhiều cách (xem nguồn, DevTools
Network, sitemap, route `/api/...` đoán mò, Firebase service worker) nhưng
trình duyệt hiện tại không xem được Network/JS nên chưa tìm ra URL đó.
Sitemap của site cũng chỉ liệt kê 10 chương đầu mỗi truyện, không dùng
làm mục lục được. URL chương thiếu slug tên (vd `/chuong-2` khi chương
thật là `/chuong-2-nhiem-vu-hoan-thanh`) thì site trả lỗi "Application
error: a server-side exception" — nên không liệt kê chương bằng cách
đoán số được.

`toc.js` hiện làm 3 lớp (link trong DOM + regex trên HTML thô để bắt dữ
liệu Next.js nhúng + sắp xếp theo số chương) và trả về những chương tìm
được (thường là chương 1 + chương mới nhất), kèm log cảnh báo số lượng
thiếu. Đọc chương 1 và chương mới nhất vẫn chạy; đọc giữa truyện thì
chưa có mục lục đầy đủ.

**Việc cần làm tiếp:** mở trang chi tiết một truyện trên máy tính, bấm
F12 → tab Network → tải lại trang, tìm request trả về danh sách chương
và copy URL của nó. Có URL đó thì `toc.js` đổi sang gọi API là xong.

## Kiểm thử

- `node tools/cli/validate.js` (repo root) — kiểm tra manifest, registry,
  fixture.
- `node tools/cli/build.js extensions/novel/apptruyenchu` — đóng zip
  (lib-inline tự động).
- Test thật trên app vBook cần điện thoại bật chế độ dev (developer
  server): `node .agents/skills/vbook-extensions/scripts/vbook.js test
  extensions/novel/apptruyenchu <script.js> [args...]` — xem
  `.agents/skills/vbook-extensions/reference/cli.md`.
