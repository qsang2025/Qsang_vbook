# Zongheng (纵横中文网) — v1

- **Nguồn:** https://www.zongheng.com/ (nền tảng truyện chữ lớn chính thống của Trung Quốc)
- **Type:** `chinese_novel`, locale `zh_CN`, tác giả `MuseAi`, encrypt `false`.
- **Port từ:** zongheng v4 của hajljnopera (ref: hajljnopera) — xem khảo sát đầy đủ ở `~/workspace/vbook/work/ext-review/ZONGHENG-SURVEY-2026-11-11.md`.

## Base v4 dùng lại được ~55–60%

Giữ nguyên: store (`.bookbox`), mục lục showchapter (kể cả class `vip`),
nội dung chương thường (`div.content`), detail huayu (template cũ).
Viết lại: rank (parse payload `__NUXT__`), detail trang chính
(selector `.book-info--*` + mô tả từ `__NUXT__`), tìm kiếm (API JSON
`/search/book` — tốt hơn scrape cũ), marker VIP + lọc rác quảng cáo.

## Các thay đổi chính so với base v4

- **Tìm kiếm:** API JSON `GET https://search.zongheng.com/search/book`
  (trả `bookId/name/coverUrl/authorName/description/chapterName/totalWord`),
  thay cho scrape HTML trang `/s` (đã chết — vỏ rỗng, render bằng JS).
- **Bảng xếp hạng:** parse `window.__NUXT__` (function args truyền theo
  vị trí): 6 danh sách top 10 có sẵn trong mọi trang `/rank`
  (月票榜, 人气榜, 新书榜, 点击榜, 推荐榜, 新书订阅榜).
- **Chi tiết:** phân nhánh theo DOM thật — trang chính Nuxt
  (`.book-info--title`, `.author-info--name`, `.book-info--coverImage`,
  `.book-info--tags`, `.book-info--nums`, `.book-info--chapter`;
  mô tả lấy từ `__NUXT__` field `description`) và huayu template cũ.
- **Mục lục:** dựng URL `showchapter/{bookId}.html` từ bookId (trang detail
  mới không có link mục lục); chương VIP gắn `[VIP] ` + `pay: true`
  (1225/1312 chương ở 剑来).
- **Chương:** `div.content > p`; VIP phát hiện bằng
  `div.reader-end.reader-order` → trả lỗi rõ "Chương VIP — cần đăng nhập
  và mua trên web zongheng.com mới đọc được" (chỉ có preview ~2 đoạn,
  không lấy được full text); lọc cụm quảng cáo `<p>` 1 ký tự
  "下载纵横小说看全文"; tiêu đề chương lấy từ `<title>`.
- **Chuẩn repo:** `config.js` (DOMAIN select, MIRRORS rỗng — không có
  mirror độc lập), `rate-limit.js` chung (pacedFetch), safe-first cho
  `.first()`, không xoay User-Agent, lỗi tiếng Việt, next token `""`,
  không viết `load('...')` trong comment. Thêm `book.js` (script danh
  sách dùng chung cho tab home). Không có `page.js` (mục lục 1 trang).

## Chưa có trong v1 (ghi rõ, không giấu)

- **Không có `genre.js`:** tham số lọc thể loại `c` của endpoint store
  hiện bị site bỏ qua (c1/c3/c6/c9 đều trả cùng 50 truyện); trang thể
  loại mới `/books?worksTypes=...` là Nuxt SPA, chưa tìm được API dữ
  liệu của nó trong thời gian khảo sát. Hướng tiếp theo: soi JS bundle
  của trang /books tìm API rồi thêm genre sau.
- **4 bảng xếp hạng chưa có:** 24h畅销榜 (rt=3), 捧场榜 (rt=7),
  完结榜 (rt=8), 24h更新榜 (rt=10) — chỉ nạp bằng API client-side,
  không có trong payload SSR; cần tìm API rank riêng.
- **Chương VIP không đọc được** (paywall thật của site, cần đăng nhập +
  trả tiền trên web). Extension chỉ báo rõ, không bypass.
- **Tìm kiếm chỉ quét trang chính** (`isFromHuayu=0`); chưa tìm cả
  huayu trong cùng 1 lần gọi.
