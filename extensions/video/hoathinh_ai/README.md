# Hoạt Hình AI Trung Quốc (Dailymotion)

Extension vBook cho phim hoạt hình AI / truyện tranh động (漫剧) / short drama
Trung Quốc thuyết minh — nguồn dữ liệu là **API công khai của Dailymotion**
(không cần khóa, trả JSON). Type `video`, locale `vi_VN`.

- Author: Qsang
- Version: 1
- Encrypt: false
- Khảo sát: `.agents/teamwork/explorer_r1_3/handoff.md` (mục 1.5) + kiểm chứng
  live từ VM ngày 2026-11-06

## Vì sao dùng Dailymotion thay vì shorttv.live

Nguồn dự định ban đầu là `shorttv.live` (ShortMax) — trang tập phim của nó
chứa trực tiếp link `.m3u8` của `akamai-static.shorttv.live` (đã kiểm chứng).
Nhưng **tìm kiếm qua shorttv không làm được**: `/vi/search` là trang SPA,
không nhận tham số từ khóa và không trả kết quả SSR (kiểm chứng 2026-11-06:
`?keyword=` và `?q=` đều trả về cùng một trang 71 KB, 0 drama-card); API
search thật của shorttv dùng POST mã hóa AES-128-CBC nên không dùng theo
chỉ dẫn. Vì extension bắt buộc có vòng đời đầy đủ gồm `search`, toàn bộ
extension đã đổi sang **Dailymotion API**.

## Cấu trúc nguồn (Dailymotion)

- Tìm kiếm: `GET https://api.dailymotion.com/videos?search=<q>&page=<n>&limit=20&fields=id,title,description,duration,thumbnail_720_url,owner.screenname`
  — 20 kết quả/trang, `has_more` cho biết còn trang sau, trang 2 không trùng
  trang 1 (kiểm chứng 2026-11-06).
- Chi tiết: `GET https://api.dailymotion.com/video/<id>?fields=id,title,description,thumbnail_720_url,owner.screenname,duration,created_time,views_total`
- Stream: `GET https://www.dailymotion.com/player/metadata/video/<id>`
  → `.qualities.auto[0].url` là link `.m3u8` gốc của CDN
  (`cdndirector.dailymotion.com/cdn/manifest/video/<id>.m3u8?...`).
- Từ khóa đã chọn sẵn (tab home + thể loại): "hoạt hình AI trung quốc thuyết
  minh", "truyện tranh động thuyết minh", "hoạt hình 2D trung quốc thuyết
  minh", "tu tiên thuyết minh".
- Lưu ý: API trả trường owner dạng **phẳng** `"owner.screenname"` (key có dấu
  chấm), không phải object lồng nhau — đọc bằng key chuỗi.

## Chuỗi phát (chap → track)

`detail` (video đơn lẻ, format `stream`) → `toc` (1 mục "Xem video") →
`chap` (1 server "Dailymotion", data = video id) → `track` (gọi metadata,
trả `{type: "native", data: <link .m3u8>, mimeType: "application/x-mpegURL",
headers: {Referer: "https://www.dailymotion.com/"}}`).
Tuyệt đối không dùng `streamfree.vip`. Không xoay User-Agent (AGENTS.md §6
quy tắc 10); `home.js` chỉ trả tab tĩnh, không fetch (quy tắc 9).

## Lưu ý kiểm chứng phát video

Từ VM này, fetch trực tiếp playlist `.m3u8` do metadata trả về bị **HTTP 403**
(dù đã thử Referer + cookie) — nhiều khả năng CDN Dailymotion chặn IP
datacenter, tương tự trường hợp apptruyenchu.pro 403 trên GitHub runner
2026-11-06. `track.js` vì vậy chỉ kiểm chứng được **OUTPUT** (URL `.m3u8`
đúng định dạng, đúng video) trên máy thật; việc phát thật chỉ xác nhận được
khi Anh bấm Play trên app (ExoPlayer chạy trên IP của máy).

## Trạng thái

- 2026-11-06: v1 — build, validate, health-check, testall trên máy thật
  (xem báo cáo bàn giao của agent xây dựng).
