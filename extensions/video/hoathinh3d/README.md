# Hoạt Hình 3D Trung Quốc — vBook Extension

Xem phim hoạt hình 3D Trung Quốc (Donghua 3D) Vietsub & Thuyết minh: Thế Giới
Hoàn Mỹ, Tiên Nghịch, Đấu Phá Thương Khung, Linh Cảnh Hành Giả, Thôn Phệ Tinh
Không, Già Thiên, Phàm Nhân Tu Tiên...

- **Nguồn:** API JSON công khai `https://phimapi.com` (không scrape HTML,
  không Cloudflare). `metadata.source` trỏ tới
  `https://phimapi.com/v1/api/the-loai` thay vì root `/` — vì đây là domain
  chỉ có API, root `/` trả 404 (health-check probe GET `metadata.source`
  nên phải trỏ tới endpoint trả 200); `config.DOMAIN.default` vẫn là
  `https://phimapi.com` để `BASE_URL` ghép đúng các endpoint API.
- **Type:** `video` · **Locale:** `vi_VN` · **Version:** 1 · **Author:** Qsang.
- **Chuỗi phát:** `toc` → `chap` → `track`; `track` trả về link `.m3u8` trực
  tiếp (`type: "native"`, `mimeType: "application/x-mpegURL"`). Tuyệt đối
  không dùng `streamfree.vip` (xem lý do ở mục bên dưới).

## API đã khảo sát (2026-11-06, kiểm chứng live bằng curl)

| Chức năng | Endpoint |
|---|---|
| Danh sách donghua TQ | `GET /v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=<slug>&page=N` — 24 phim/trang, `data.params.pagination {currentPage, totalPages}` |
| Thể loại | `GET /v1/api/the-loai` → `{items:[{name, slug}]}` |
| Chi tiết phim | `GET /phim/<slug>` → `{movie, episodes:[{server_name, server_data:[{name, slug, link_m3u8, link_embed}]}]}` |
| Tìm kiếm | `GET /v1/api/tim-kiem?keyword=<q>&page=N` |

- Ảnh `thumb_url`/`poster_url` là đường dẫn tương đối → ghép với CDN ảnh
  `https://phimimg.com/` (`APP_DOMAIN_CDN_IMAGE` trong response).
- Thể loại thật của site: `than-thoai`, `vo-thuat`, `vien-tuong`, `co-trang`,
  `khoa-hoc`, `phieu-luu`, `hanh-dong`... — **không có** `huyen-huyen` /
  `kiem-hiep` (2 slug này trả 404; đừng dùng).
- Lọc theo thể loại phải dùng `danh-sach/hoat-hinh?category=<slug>`; endpoint
  `the-loai/<slug>?filterType=hoat-hinh` không lọc (trả lẫn phim lẻ/phim bộ).
- Loại `phim-18` (NSFW) bị loại khỏi `genre.js` theo quy tắc nhà §6.7.

## Cách các script làm việc

- `home.js` — chỉ trả 5 tab tĩnh (quy tắc 9), không fetch: Mới Cập Nhật 3D,
  Tu Tiên & Huyền Huyễn, Võ Thuật & Kiếm Hiệp, Khoa Huyễn Dị Giới, Cổ Trang
  & Xuyên Không. Mỗi tab trỏ về `search.js` với input là đường dẫn danh
  sách của API.
- `genre.js` — lấy danh sách thể loại từ `/v1/api/the-loai`, mỗi mục trỏ về
  `search.js` với `danh-sach/hoat-hinh?category=<slug>`.
- `search.js` — vừa tìm từ khóa (`/v1/api/tim-kiem`), vừa render tab danh
  sách (query bắt đầu bằng `/` hoặc `http`).
- `detail.js` — `GET /phim/<slug>` → `type: "video"`, `format: "series"`,
  `genres` là chip thể loại trỏ về `search.js`.
- `toc.js` — gộp các tập trùng slug giữa các server (Vietsub + Thuyết Minh)
  thành 1 mục; URL mục = `/phim/<slug>?ep=<slug-tap>`.
- `chap.js` — tìm tập đó trong mọi server, trả 1 mục/server, `data` là
  `link_m3u8` trực tiếp.
- `track.js` — `.m3u8` → `native` + `mimeType: "application/x-mpegURL"`,
  `.mp4` → `native` + `video/mp4`, trang embed → `auto`; kèm
  `Referer: https://phimapi.com/`.

## Lưu ý về link m3u8

Link `.m3u8` trong API trỏ tới các CDN (vd. `s5.phim1280.tv`,
`a.kvp726.com`, `v7.kkphimplayer7.com`). Từ IP datacenter của VM, các link
này trả **404** dù là tập mới nhất (kiểm chứng 2026-11-06, cả link của tập
phát hành hôm trước) — nhiều khả năng CDN chặn IP máy chủ. Vì vậy test qua
dev server chỉ kiểm chứng được **output của script** (chap/track có trả đúng
link không), không kiểm chứng được phát video thật; phát thật chỉ xác nhận
được khi bấm Play trong app trên điện thoại (IP di động).

## Vì sao không dùng hhkungfu / streamfree

`hhkungfu.ee` phát qua embed `streamfree.vip`, mà embed này mã hóa stream
bằng chunked Base64 + Service Worker giải mã vào MSE trong trình duyệt nên
ExoPlayer của vBook không bao giờ bắt được link — đã chứng minh không sửa
được trong extension (xem `~/workspace/vbook/hhkungfu-fix/tong-hop.md`).
Extension này tránh hoàn toàn hướng đó bằng cách dùng API trả link `.m3u8`
trực tiếp.

## Kiểm thử

```bash
node scripts/cli.js validate
node scripts/cli.js build extensions/video/hoathinh3d
node scripts/cli.js build-catalog
node scripts/cli.js health-check
node scripts/cli.js testall extensions/video/hoathinh3d
```
