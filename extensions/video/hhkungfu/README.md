# HHKUNGFU — Phim Hoạt Hình Kungfu Trung Quốc Vietsub / Thuyết Minh

Extension video cho **https://hhkungfu.ee/** — phim hoạt hình 3D Trung Quốc
(Thương Nguyên Đồ, Đấu La Đại Lục, Tru Tiên, Nghịch Thiên Chí Tôn...).
Loại: `video`, locale `vi_VN`, format `series`. Version 1 (2026-11-06).

## Cách site hoạt động (khảo sát 2026-11-06)

- Site WordPress, theme HaLim. Thẻ phim: `<a class="halim-thumb"
  href="https://hhkungfu.ee/<slug>">` với ảnh `img.film-poster-img`,
  `<span class="status">` (FULL HD 4K), `<span class="episode">`
  (Tập 102/129 [4K]), `<h2 class="entry-title">`, `<p class="original_title">`.
- Trang chi tiết: `<h1>` tên phim, `<h2 class="org_title">` tên gốc,
  `meta og:image` = poster chất lượng cao, `.list_cate a` = thể loại,
  `.hh3d-new-ep .new-ep` = tập mới nhất, `.hh3d-info` = "Tình trạng:"
  (Đang chiếu / Hoàn thành) và "Lượt xem:". Mô tả: `.halim-entry-box article p`.
- Danh sách tập: các `<div class="halim-server">` — **#Vietsub** (data-sv=1)
  và **#Thuyết Minh** (data-sv=2). Mỗi tập là
  `<a data-post-id data-ep="tap-N" data-sv href="/watch-<slug>/tap-<N>-sv<S>.html">`.
  Hai nhóm có thể khác số tập (phim mẫu: Vietsub 102 tập, Thuyết Minh 98 tập).
  TOC trả về tăng dần (tập 1 → mới nhất); tập Thuyết Minh có hậu tố "(Thuyết Minh)".
- Server xem: 2 nút `.get-eps` trên trang xem — **"1080P V1"** (data-type=`tiktik`)
  và **"1080P V2"** (data-type=`pro`). Site nhắn: đang đứt cáp, chọn V2 mượt hơn.
- Player **không** nằm sẵn trong HTML trang xem (iframe rỗng). Site gọi AJAX:
  `GET /player/player.php?action=dox_ajax_player&post_id=<id>&chapter_st=tap-N&type=<tiktik|pro>&sv=<1|2>`
  → trả về `<iframe src="https://streamfree.vip/embed/vt|<id>">`.
  Tập chưa có video ở server đó trả về iframe `not-found.jpg` — track.js
  phát hiện và báo lỗi tiếng Việt để người dùng đổi server.
- Video host là **streamfree.vip** (trình phát JS giải mã chunk bằng WASM/WebWorker,
  kiểm tra bắt buộc chạy trong iframe `window.top !== window.self` với Referer từ site nguồn,
  không có link raw `.m3u8` unencrypted trên trang). Resolver `type: "auto"` của vBook dùng
  headless WebView để sniff link media nên bị chặn và báo lỗi "Không thể tải máy chủ này. Hãy thử máy chủ khác."
  Từ v2, `track.js` bọc `embedUrl` trong HTML iframe container (width/height 100%, background đen)
  và trả về `type: "webview"` với `host: BASE_URL`, giúp player JWPlayer khởi tạo và phát trực tiếp
  ngay trong WebView của vBook mượt mà.
- Phân trang WordPress dạng `/page/N/` (không phải `?page=N`):
  `/moi-cap-nhat/page/2`, `/category/tu-tien/page/2`, `/page/2/?s=<từ khóa>`.
  Trang chủ `/` không phân trang (chỉ 16 phim mới nhất) nên tab home dùng
  `/moi-cap-nhat`. Thể loại dùng URL chuẩn **không** có `/` cuối
  (`/category/tu-tien` — có `/` cuối site redirect 301 về không slash).
- 8 thể loại: Tu Tiên, Kiếm Hiệp, Luyện Cấp, Trùng Sinh, Xuyên Không,
  Hài Hước, Hiện Đại, OVA.

## Các script

| Script | Vai trò |
|---|---|
| `home.js` | 3 tab: Mới cập nhật (`/moi-cap-nhat`), Xem Nhiều (`/top-xem-nhieu`), Hoàn Thành (`/hoan-thanh`) → `search.js` |
| `genre.js` | Đọc 8 thể loại từ menu trang chủ (dự phòng: danh sách cứng đã xác minh) → `search.js` |
| `search.js` | Vừa tìm kiếm (`/?s=<từ khóa>`), vừa là script danh sách cho tab (đường dẫn/URL) |
| `detail.js` | Tên, poster (og:image), mô tả, tên gốc / tình trạng / tập mới nhất / lượt xem, thể loại |
| `toc.js` | Toàn bộ tập cả 2 nhóm Vietsub + Thuyết Minh, tăng dần |
| `chap.js` | Đọc trang xem → 2 server 1080P V1 / V2 (URL player.php) |
| `track.js` | Gọi player.php → iframe embed → `auto` (thử bóc .m3u8/.mp4 trước, không được thì `auto`) |

## Cạm bẫy đã gặp

- `el.select("div")` trong jsoup **trả cả chính el** nếu el khớp selector —
  phải dùng `el.select("> div")` để lấy div con trực tiếp (lỗi này làm
  mất "Tình trạng / Lượt xem" ở lần test detail đầu tiên, đã sửa).
- `fetchWithFallback` nằm trong `fetch-helpers.js` — script nào dùng phải
  `load('fetch-helpers.js')` (lỗi lần test đầu tiên, đã sửa).
- Regexp dùng negative lookahead để loại trang danh sách
  (`moi-cap-nhat`, `top-xem-nhieu`, `hoan-thanh`, `category`, `tag`,
  `watch-`, `page`) khỏi routing detail — đã kiểm tra 9 URL (3 phim khớp,
  6 trang danh sách không khớp).

## Kiểm thử (trên máy thật, 2026-11-06)

- detail: Thương Nguyên Đồ — tên, poster og:image, mô tả đầy đủ,
  "Tên gốc: Cang Yuan Tu / Tình trạng: Đang chiếu / Tập mới nhất:
  Tập 102/129 [4K] / Lượt xem: 759.9K", ongoing=true, 3 thể loại.
- toc: đúng **200 tập** (102 Vietsub + 98 Thuyết Minh), có "Tập 1",
  "Tập 102", "Tập 5 (Thuyết Minh)".
- chap (tap-1-sv1): 2 server 1080P V1 / V2, đúng URL player.php.
- track (V1): `type: "auto"`, data `https://streamfree.vip/embed/vt/rKUm92Gw`.
- track (sv2/tap-1 — tập chưa có video): báo lỗi
  "Tập này chưa có video ở server này, thử server khác".
- search "thương nguyên đồ": kết quả đầu đúng phim, tag "FULL HD 4K ·
  Tập 102/129 [4K]". `/moi-cap-nhat` trang 1 + 2: mỗi trang 16 phim,
  có trang kế. genre: đủ 8 thể loại.
- `validate.js`: PASS (2 nguồn, 0 cảnh báo).
