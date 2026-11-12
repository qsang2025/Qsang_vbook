# 17k (17K小说网) — vBook extension

- **Site:** https://www.17k.com (nền tảng truyện chữ tiếng Trung chính thống lớn)
- **Loại:** `chinese_novel`, locale `zh_CN`
- **Base:** port từ 17k v3 của hajljnopera (fork `vbook-ext_hajljnopera`),
  viết lại hoàn toàn theo hợp đồng vBook hiện tại (fetch/Response, config.js,
  pacing rate-limit, `Response.error` tiếng Việt, Rhino ES6).
- **Attribution:** code gốc hajljnopera; tác giả manifest là `MuseAi` theo
  quy tắc nhà §11.

## Luồng

- `home.js` — 8 tab bảng xếp hạng tĩnh → `gen.js` (API rank
  `api.17k.com/book/rank/client`, 20 truyện/trang, phân trang theo `hasMore`).
- `genre.js` — 14 thể loại tĩnh → `cat.js`
  (`/all/book/<class_sub>_0_0_0_0_0_1_<page>.html`, 30 truyện/trang).
- `search.js` — **ĐÃ BỎ** (mẫu aztruyen). API tìm kiếm cũ
  (`api.ali.17k.com/v2/book/search`) đã chết: trả 61000 "请升级版本" với
  cả 2 appKey, mọi `_versions`, cả http/https. Form web
  `search.17k.com/search.xhtml` bị WAF Alibaba (`acw_sc__v2`) chặn cả
  trên VM lẫn máy thật (test trên máy thật 2026-11-12 trả code 1 với
  thông báo tường lửa). Vì vậy `detail.js` cũng không đưa tag vào
  `genres` (tag chỉ tìm được qua search).
- `detail.js` — `/book/<id>.html`. Trạng thái đọc ở link đầu `div.label`
  ("连载小说" = đang ra, "完本小说" = hoàn thành). Tag ở `tr.label a`
  (trỏ về `search.js` theo từ khóa tag).
- `toc.js` — `/list/<id>.html`, toàn bộ chương trong 1 trang (kể cả truyện
  1.252 chương), nhiều khối `dl.Volume`. Chương VIP có `span.ellipsis.vip`
  → `pay: true` + tiền tố `[VIP] `.
- `chap.js` — `/chapter/<bookId>/<chapterId>.html`.
  **Chỉ đọc chương miễn phí.** Chương miễn phí có
  `div.readAreaBox.content > div.p` đầy đủ. Chương VIP không có
  `readAreaBox`, chỉ có 2 đoạn xem trước + dòng "VIP章节, 余下还有N个段落"
  trong `div.content` — extension KHÔNG trả teaser về như chương thật mà
  trả lỗi tiếng Việt ("Chương VIP — cần đăng nhập và mua trên web
  17k.com...").

## Truyện mẫu (test.json)

- 成为她的那一天 (3246664, 林羡, hoàn thành, 148 chương, 32 chương miễn phí)
- 星痕之门 (3583700, 伪戒, đang ra, 1.252 chương, 206 chương miễn phí)

## Điểm còn mở

- Tìm kiếm qua form web có thể bị WAF chặn tùy IP — xem kết quả test máy.
- Chỉ test 1 thể loại trên máy; 13 thể loại còn lại chỉ kiểm chứng 200 từ VM.
- Số chương truyện đang ra tăng dần nên expect test.json sẽ lỗi thời.
