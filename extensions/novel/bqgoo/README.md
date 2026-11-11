# Bqgoo (bqgoo.cc)

Extension vBook cho trang truyện chữ giản thể **Bqgoo** (笔趣阁) — huyền
huyễn, võ hiệp, đô thị, lịch sử, võng du, khoa huyễn, nữ sinh, hoàn bản.
Dữ liệu qua API JSON riêng của site (host `apibi.cc`, mirror `apiqu.cc`,
`apige.cc`), không scrape HTML. Chương đọc miễn phí toàn văn, không khóa VIP.

- Site: https://www.bqgoo.cc
- API: https://apibi.cc
- Type: `novel`, locale: `zh_CN`
- Version: 1, author: MuseAi

## Cấu trúc

| Script | Chức năng |
|---|---|
| `home.js` | 4 tab tĩnh: 热门小说, 排行榜, 最新更新, 最新入库 (trỏ về `book.js` với tên danh sách trong `/api/index`) |
| `genre.js` | Đủ 8 thể loại (`/api/sort?sort=<key>`) |
| `book.js` | Renderer danh sách chung: danh sách home (`/api/index`, hotlist 4 / toplist 9 / uplist 30 / addlist 30) và thể loại (`/api/sort`, 150 truyện) |
| `search.js` | GET `/api/search?q=` — kết quả `data:[{id,title,author,intro}]` |
| `detail.js` | GET `/api/book?id=` — tên, tác giả, thể loại, mô tả, trạng thái (`full` 连载/完结), chương mới nhất, ngày cập nhật; bìa theo công thức `bookimg/<floor(id/1000)>/<id>.jpg` |
| `toc.js` | GET `/api/booklist?id=` — `list` là mảng tên chương, chapterid = vị trí + 1 |
| `chap.js` | GET `/api/chapter?token=` — token AES-CBC (xem dưới), `txt` tách theo `\n` bọc `<p>`, tên chương trả qua data2 |

## Token chương

Chỉ `chap.js` cần token. Key/iv suy ra từ chuỗi công khai trong JS công
khai của site (không phải credential người dùng):

- `code = MD5("book@token.html") = 394c2c3202da6270a3dc22cf70418a51`
- `iv` = UTF-8 của `394c2c3202da6270`, `key` = UTF-8 của `a3dc22cf70418a51`
- `token` = base64(AES-CBC/PKCS7 encrypt `JSON.stringify({id, chapterid})`)

Đã kiểm chứng bằng node: token tự tính === token của site, GET URL token
trả 200 với full text chương. Dùng CryptoJS trong `src/crypto.js`.

## Ghi chú khảo sát (2026-11-11)

- Truyện mẫu: **夫人她马甲又轰动全城了** — id 1985, 灵小哥, 女生, 连载
  (lastupdate 2026-11-10), 7.854 chương; chương 1
  `第1章：乔家出了个假千金` mở đầu "绕城六月的天跟火炉似的…".
- **剑来** — id 1000, 烽火戏诸侯; tìm "剑来" ra đúng bản gốc đầu tiên.
- Trang chương HTML trực tiếp (`bqgooo.cc/shu/<id>/<n>.html`) chỉ là shell
  "加载中……" + cổng xác minh cookie — không đọc được, nên extension dùng
  API JSON hoàn toàn, link truyện/chương vẫn giữ dạng URL thật của site.
- Mục lục: tên chương cuối (chapterid 7854) là `第7851章：早就管不住了` —
  lệch đánh số của site, extension giữ nguyên chapterid = vị trí + 1.
- Nội dung thể loại `nvsheng`/`kehuan` có lẫn truyện không khớp thể loại —
  lỗi dữ liệu của site, không phải lỗi extension.
- Icon: favicon thật của site (bqg349.xyz), upscale 16×16 lên 200×200
  bằng PIL LANCZOS.

## Giới hạn đã biết

- Mục `suggests` ở detail để trống: API không có mục truyện gợi ý.
- Danh sách home (`/api/index`) và thể loại (`/api/sort`) thay đổi theo
  ngày — tên truyện đầu danh sách trong `test.json` có thể lỗi thời, cần
  cập nhật theo trang hiện tại khi test lại.
