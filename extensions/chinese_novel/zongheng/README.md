# Zongheng (纵横中文网) — v2 (hybrid web + API app)

- **Nguồn:** https://www.zongheng.com/ (nền tảng truyện chữ lớn chính thống của Trung Quốc)
- **Type:** `chinese_novel`, locale `zh_CN`, tác giả `MuseAi`, encrypt `false`.
- **Port từ:** zongheng v4 của hajljnopera (ref: hajljnopera) — xem khảo sát đầy đủ ở `~/workspace/vbook/work/ext-review/ZONGHENG-SURVEY-2026-11-11.md`.
- **v2 hybrid (2026-11-11):** giữ nguyên đường đọc chính web v1; chỉ bổ sung
  thể loại + 3 bảng xếp hạng từ API **công khai** của app Zongheng
  (`api2.zongheng.com`, gọi được ẩn danh, code 200 — xem
  `~/workspace/vbook/work/ext-review/ZONGHENG-APP-API.md`). Các endpoint
  nội dung của app (search/books, chapter/list, chapter/so/download…)
  đều trả 602 Unauthorized nên KHÔNG đụng vào, không bẻ chữ ký.

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

## v2 hybrid — thể loại + bảng xếp hạng qua API app công khai

- **Thể loại (`genre.js` mới):** `GET /api/catefine/searchConf` trả 12 thể
  loại (全部 0, 玄幻奇幻 8101, 武侠仙侠 8102, 都市 8103, 历史 8104,
  科幻 8105, 奇闻异事 8106, 游戏 8107, N次元 8108, 现实题材 8109,
  体育 8110, 军事 8111); mỗi thể loại gọi `POST /api/catefine/search`
  `{"cateFineId":N,"pageNo":1,"pageNum":20}` — 20 truyện/trang, phân trang
  theo `hasNext`. Nếu searchConf tạm lỗi, dùng danh sách dự phòng đã kiểm
  chứng cùng ID (ghi trong `genre.js`).
- **Bảng xếp hạng (`book.js`, thêm nhánh `/api/rank/list`):**
  `POST /api/rank/list {"rankType":N}` — mỗi bảng 10 mục (rankType 2 chỉ
  6 mục; API không phân trang thật). Thêm 3 tab home: 畅销榜 (rankType 3,
  doanh số — tương đương rt=3 24h畅销榜), 推荐票榜 (rankType 7, phiếu đề
  cử), 打赏榜 (rankType 8, 打赏 — tương đương rt=7 捧场榜).
- **Không thêm được (ghi rõ, không giấu):** rt=8 完结榜 và rt=10 24h更新榜
  không có tương đương trong app API — rankType 10 trả **HTTP 500**
  (không phải danh sách rỗng), không có bảng nào lọc theo hoàn thành hay
  cập nhật 24h. rankType 2 cùng metric doanh số với rankType 3 nhưng chỉ
  trả 6 mục nên không thêm tab riêng.

## Chưa có trong v2 (ghi rõ, không giấu)
- **Chương VIP không đọc được** (paywall thật của site, cần đăng nhập +
  trả tiền trên web). Extension chỉ báo rõ, không bypass.
- **Tìm kiếm chỉ quét trang chính** (`isFromHuayu=0`); chưa tìm cả
  huayu trong cùng 1 lần gọi.
