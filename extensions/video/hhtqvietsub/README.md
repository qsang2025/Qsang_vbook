# HHTQ Vietsub — vBook Extension

Xem phim hoạt hình 3D Trung Quốc Vietsub trên `https://hhtq.press`
(HH3D / HHTQ): Tru Tiên, Tiên Nghịch, Đấu Phá Thương Khung, Linh Cảnh
Hành Giả...

- **Nguồn:** site WordPress theme HalimMovies tại `https://hhtq.press`
  (khảo sát live 2026-11-20, HTTP 200, miễn phí, không VIP/paywall).
- **Type:** `video` · **Locale:** `vi_VN` · **Version:** 2 ·
  **Author:** MuseAi.
- **Chuỗi phát:** `toc` → `chap` → `track`. `chap` gọi player của site
  lấy trang embed, `track` xin link phát thật qua API của trang embed
  rồi trả `native` (xem mục `track.js` bên dưới), cuối cùng mới nhúng
  trang embed bằng `webview`.
- Build mới từ đầu: bản Darkrai9x `hhtqvietsub` bị mã hoá toàn bộ
  `src/*.js` (không đọc được, không có `function execute`) nên không
  dùng lại được code; bản đó chỉ chứng minh site làm được extension.

## Cấu trúc site đã khảo sát (2026-11-20)

| Chức năng | Cách lấy dữ liệu |
|---|---|
| Danh sách | HTML `article.grid-item > a.halim-thumb` (ảnh lazyload ở `data-src`, `span.episode`, `span.status`, `h2.entry-title`, `p.original_title`); phân trang `ul.page-numbers a.next` (`/page/<n>`) |
| Tìm kiếm | `/search/<từ-khóa>` (site redirect `?s=` về đường dẫn này), phân trang `/search/<từ-khóa>/page/<n>` |
| Chi tiết | `h1.entry-title`, `img.movie-thumb`, `p.org_title`, `p.released a`, `p.episode`, `p.directors a`, `p.actors a`, `p.category a`, `.entry-content .item-content` |
| Mục lục tập | Không có sẵn trong HTML chi tiết. POST `halim-ajax.php` với `action=halim_episode_pagination`, `postid`, `server`, `cur_sv`, `eps_nav` (cụm 100 tập từ `.eps-page-nav`), `episode`, `eps_link` → HTML `li.halim-episode a` (`/-<slug>/tap-<n>-sv1.html`) |
| Phát | GET `player.php?episode_slug=tap-<n>&server_id=<sv>&subsv_id=&post_id=<id>&nonce=<body data-nonce>&custom_var=` → JSON `{data:{sources:"<iframe ...>"}}`. `post_id`/`episode_slug`/`server` nằm trong biến `halim_cfg` nhúng trong trang |

Trang embed của player nằm trên host bên thứ ba và xoay theo tập
(Tập 1: `embed1.streamc.xyz/embed.php?hash=...`; Tập 94:
`tenmienphu68.lol/mediav2/tap-94-sv1`). Host `tenmienphu68.lol` trả
**403 từ IP datacenter của VM** (kiểm chứng 2026-11-20) — giống trường
hợp CDN của hoathinh3d — nên khảo sát/test host này phải qua điện
thoại (IP di động); phát thật chỉ xác nhận được khi bấm Play trong app.

Trang embed là trang JWPlayer: HTML không chứa link `.m3u8`/`.mp4` dạng
chữ, chỉ có khối `stream-bootstrap` (`api` trỏ lại chính URL embed).
Player xin link phát bằng POST `bootstrap` rồi `issue` tới `api` đó;
playlist trả về là path ký mờ trên cùng origin (không chứa `.m3u8`),
dạng thường (`hls`) hoặc bị niêm phong AES-GCM (`aesgcm-v2`, chỉ player
trong trang tự giải được). Bản v1 chỉ regex HTML rồi trả `auto` nên app
báo "Không thể tải máy chủ này" (task 116) — v2 sửa theo cơ chế này.

## Cách các script làm việc

- `home.js` — 4 tab tĩnh (quy tắc 9), không fetch: Mới Cập Nhật
  (`/last-update`), Hoàn Thành (`/completed`), Trung Quốc
  (`/country/trung-quoc`), Danh Sách A-Z (`/az-list`).
- `genre.js` — tab tĩnh các chuyên mục thật của site: mới cập nhật,
  hoàn thành, quốc gia, năm phát hành (2026/2024/2023/2022), lịch
  chiếu theo thứ. Site không có trang thể loại riêng.
- `search.js` — vừa tìm từ khóa (`/search/<từ-khóa>`), vừa render tab
  danh sách (query bắt đầu bằng `/` hoặc `http`); token trang kế tiếp
  là URL tuyệt đối từ link `a.next.page-numbers`.
- `detail.js` — `type: "video"`, `format: "series"`, `genres` là chip
  category trỏ về `search.js`.
- `toc.js` — đọc `post_id` từ `halim_cfg`, gọi AJAX mục lục cho từng
  cụm `.eps-page-nav` (100 tập/cụm), gộp theo thứ tự, bỏ trùng theo
  URL. AJAX rỗng thì fallback dựng URL tập từ link "Xem phim" và
  khoảng tập trong `data-text`.
- `chap.js` — đọc `halim_cfg` + `data-nonce` của trang xem phim, gọi
  `player.php`, trả 1 mục/server: `data` là link stream trực tiếp nếu
  `sources` có `.m3u8`/`.mp4`, ngược lại là URL iframe embed; player
  lỗi thì trả chính URL trang xem phim để `track` thử lại.
- `track.js` — `.m3u8`/`.mp4` → `native`; trang xem phim của site →
  gọi lại player; trang embed → bóc stream trực tiếp → xin playlist
  thường qua API `stream-bootstrap` (POST `bootstrap`/`issue`,
  `bootstrap_format: "json"`, `playlist_format: "hls"`; playlist bị
  niêm phong hoặc đòi Turnstile thì bỏ) → render bằng trình duyệt
  headless tìm URL media thật → cuối cùng `webview` nhúng trang embed.
  Không dùng `auto` ở fallback cuối vì sniff hụt là lỗi cứng. Chỉ gửi
  `Referer`, không xoay User-Agent (quy tắc 10).

## Kiểm thử

```bash
node scripts/cli.js validate
node scripts/cli.js build extensions/video/hhtqvietsub
node scripts/cli.js build-catalog
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js testall extensions/video/hhtqvietsub
```
