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

## Mục lục (toc) — lấy qua Next.js Server Action (đã giải quyết, v2)

Danh sách chương KHÔNG có trong HTML tải lần đầu (trang chi tiết chỉ có
2 link chương: nút "Đọc truyện" và link "Chương mới nhất"), sitemap chỉ
liệt kê 10 chương đầu mỗi truyện, và URL chương thiếu slug tên
(vd `/chuong-2` khi chương thật là `/chuong-2-nhiem-vu-hoan-thanh`) thì
site trả lỗi "Application error" — nên không liệt kê chương bằng cách đoán
số được.

Cách lấy đúng (tìm ra nhờ phân tích code JS của site, xác minh bằng curl
ngày 2026-11-06: HTTP 200, trả về đủ 2.479 chương cho truyện mẫu):

1. Lấy `bookId` (24 ký tự hex) trong HTML trang chi tiết, dạng
   `"bookId":"<24 hex>"` (nằm trong dữ liệu RSC nhúng của Next.js).
2. `POST` về chính URL truyện với header
   `Next-Action: 40846d9ab28025db6a72550e98f102a4cdecf4a9a7`
   (ID của Server Action `fetchChaptersOfBook`),
   `Content-Type: text/plain;charset=UTF-8`,
   `Accept: text/x-component`, body JSON `["<bookId>"]`.
3. Response là stream Server Action; dòng bắt đầu `1:[` là mảng JSON
   `[{value, label, slugId, number, isLock}, ...]`. URL chương =
   `/truyen/<slug>/<slugId>`.

`toc.js` (v2) làm theo đúng 3 bước trên; nếu Server Action thất bại thì
fallback về link chương trong DOM (chương 1 + chương mới nhất) thay vì
báo lỗi ngay.

**Lưu ý bảo trì:** `Next-Action` ID là hash sinh lúc build website, cố
định ở bản build hiện tại. Nếu site deploy bản mới và đổi ID (dấu hiệu:
toc chỉ trả 2 chương, log báo Server Action thất bại), lấy ID mới bằng
cách tải file chunk JS chứa chuỗi `fetchChaptersOfBook` (tìm trong HTML
thẻ `<script src="/_next/static/chunks/...js">`) rồi regex
`createServerReference\("([a-f0-9]{40})"[^)]*"fetchChaptersOfBook"\)`.
Firebase của site chỉ dùng cho Auth (đăng nhập), không dùng để lấy chương
nên extension không cần cấu hình Firebase.

## Kiểm thử

- `node tools/cli/validate.js` (repo root) — kiểm tra manifest, registry,
  fixture.
- `node tools/cli/build.js extensions/novel/apptruyenchu` — đóng zip
  (lib-inline tự động).
- Test thật trên app vBook cần điện thoại bật chế độ dev (developer
  server): `node .agents/skills/vbook-extensions/scripts/vbook.js test
  extensions/novel/apptruyenchu <script.js> [args...]` — xem
  `.agents/skills/vbook-extensions/reference/cli.md`.
