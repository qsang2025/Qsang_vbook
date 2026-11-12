# Tadu (塔读小说网) — vBook extension

Đọc truyện chữ tiếng Trung trên www.tadu.com: duyệt theo 14 thể loại,
tìm kiếm, chi tiết, mục lục đầy đủ, đọc chương qua API nội dung của site.

## Cơ chế site (kiểm chứng live 2026-11-12)

- **Trang chủ / thể loại:** home 10 tab thể loại nam (id 99/103/135/108/113/
  112/109/111/128/107); genre thêm 女频 (122), 出版 (79), 二次元 (270),
  短篇小说 (281). Danh sách qua `/store/<cat>-a-0-5-a-40-t-<page>-<channel>`
  (30 truyện/trang, selector `.bookList > li`).
- **Tìm kiếm:** form của site là `POST /search` với tham số `query`
  (tham số `key`/`keyword` bị site bỏ qua, chỉ trả danh sách hot).
  Trang sau dùng `GET /search?query=<kw>&pageSize=30&pageNum=<n>`.
  Kết quả cùng cấu trúc `.bookList > li` như trang store.
- **Chi tiết:** `a.bkNm` (tên), `.bookNm span` (tác giả, có hậu tố " 著"),
  `a.bookImg img[data-src]` (bìa; `src` là ảnh chờ coverBg.jpg),
  `p.intro`, trạng thái `meta og:novel:status` (连载/完结), số chương
  `span.directory` ("目录（284章）"), số liệu `.datum`,
  thể loại `.sortList a` (không có href nên trỏ về search.js theo từ khóa).
- **Mục lục:** `/book/catalogue/<bid>` trả toàn bộ chương trong 1 trang
  (284 và 438 chương đều 1 trang, không phân trang). Link chương nằm
  trong `div.chapter.clearfix`, href có khoảng trắng thừa 2 đầu.
- **Chương:** trang chương có `input#bookPartResourceUrl` với giá trị
  `/getPartContentByCodeTable/<bid>/<số thứ tự chương>`; GET đường dẫn
  đó trả JSON `{"status":200,"data":{"content":"<p>...</p>..."}}` —
  nội dung là HTML đơn thuần, **không mã hoá** (khác xtruyen), không cần
  WebView. Trong content có chèn dòng quảng cáo/watermark của site
  (vd. "原文&来~自于塔读小~说APP…") — nhận diện bằng chữ "塔读" và loại bỏ.
  Tên chương lấy từ `<title>` (dạng `TênTruyện_第1章 ..._ThểLoại_TácGiả_...`).

## Attribution

Port từ Tadu v2 của Nhocconsr (fork lethituyen, `vbooks-extension_lethituyen`):
giữ lại ý tưởng (endpoint catalogue, resource URL chương, 10 tab thể loại)
và viết lại toàn bộ theo hợp đồng extension-api.md hiện tại (fetch + pacing
+ safeFirst + Response.error tiếng Việt, locale zh_CN, author MuseAi).

## Test

Xem `test.json` (golden fixture) và `TADU-PROGRESS.md` trong
`~/workspace/vbook/work/ext-review/`.
