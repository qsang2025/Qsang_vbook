# QuanBen — quanben5.com (mặc định), quanben.io (dự phòng)

Extension đọc truyện chữ tiếng Trung miễn phí (toàn bản).
Port từ bản hajljnopera v3 (mã nguồn mở) + viết lại theo hợp đồng vBook hiện
tại và quy tắc nhà Qsang_vbook. Bản duongden v5 bị mã hóa (`encrypt: true`,
src chỉ là blob mã hóa) nên **không dùng được code của nó** — chỉ tham khảo
metadata (nó cũng liệt kê mirror quanben5.com).

## Phát hiện quan trọng: quanben.io 403 từ máy thật (2026-11-12)

Bản đầu viết theo giao diện quanben.io (đã khảo sát kỹ từ VM: trang chủ 200,
chi tiết/mục lục/chương/search đều chạy). Nhưng test trên máy thật (HONOR
PTP-AN10) thì **mọi request tới quanben.io đều HTTP 403 + trang "HTTP Server
Test Page powered by CentOS"** — đổi UA desktop, thêm `Accept-Language` đều
vẫn 403; `www.` / `http://` / `big5.` cũng 403. Từ VM thì 200 bình thường.
Kết luận: máy chủ (hoặc CDN/edge theo mạng) không nhận host quanben.io từ
mạng của máy — không phải do UA hay thiếu header. Không có trang challenge
để "qua" như Cloudflare, nên không sửa được phía extension.

Trong khi đó **quanben5.com trả 200 cho mọi request từ máy thật** (trang chủ,
chi tiết, chương). Vì vậy extension đổi domain mặc định sang quanben5.com;
quanben.io vẫn để trong config DOMAIN (select) cho máy nào mở được.

## Khảo sát quanben5.com (live 2026-11-12, VM + máy thật)

- Trang chủ HTTP 200, tiêu đề "全本小说网_免费小说阅读网站". Không Cloudflare.
  16 thể loại ở menu (`/category/<N>.html`, N = 1-15 + 18).
- Trang thể loại `/category/<N>.html`: 18 truyện/trang, mỗi truyện là
  `div.pic_txt_list` (ảnh `div.pic img`, tên `h3 > a > span`, tác giả
  `span.author` trong `p.info`, mô tả `p.description`), phân trang bằng
  link "下一页" (`/category/<N>_<P>.html`), `span.cur_page` dạng "1 / 1527".
- Trang chi tiết `/n/<slug>/`: tên `h1`, tác giả `span.author` trong
  `p.info` "作者:", thể loại `p.info` "类别:", trạng thái `p.info` "状态:"
  (完结/连载), mô tả `div.description`, bìa `div.pic_txt_list .pic img`
  (host `img.c0m.io`), link mục lục `/n/<slug>/xiaoshuo.html`,
  link thể loại ở breadcrumb `/category/<N>.html`.
  Lưu ý: trang còn mục "更多玄幻小说" (các `.pic_txt_list` khác) nên chỉ
  lấy `.pic_txt_list` ĐẦU TIÊN cho thông tin sách.
- Mục lục `/n/<slug>/xiaoshuo.html`: **toàn bộ chương trong 1 trang tĩnh**
  — truyện mẫu 傲世丹神 có 3.813 mục / 3.818 chương (thiếu 5 chương không
  tồn tại trên site). Mỗi mục: `<ul class="list"><li class="c3"><a
  href="/n/<slug>/<n>.html"><span>第<n>章 ...</span></a></li>`.
  Không cần JSONP (khác giao diện cũ quanben.io).
- Tìm kiếm qua JSONP công khai (trang `/search.html` gọi `load_more()`):
  `/?c=book&a=search.json&callback=search&t=<ms>&keywords=<kw>&b=<b>`,
  với `b` = hàm base64 riêng của site áp cho `encodeURI(keywords)` (server
  kiểm tra `b`, gửi sai trả "参数错误！5"). Trả về
  `search({"id":0,"content":"<div class=\"pic_txt_list\">..."})`.
  Không phân trang. Đã kiểm chứng: tìm "傲世丹神" trả đúng 1 kết quả.
- Chương `/n/<slug>/<n>.html`: nội dung trong `<div id="content">` (các
  đoạn `<p>`, đoạn đầu là tiêu đề chương), có `<span id="ad">` cần bỏ.

## Giao diện cũ quanben.io (đã khảo sát, để tham khảo — không dùng)

- Thể loại `/c/<slug>.html` (18 mục), chi tiết `/n/<slug>/` (selector
  `span[itemprop=*]`, `div.list2`, `div.description[itemprop=description]`),
  mục lục `/n/<slug>/list.html` chỉ 47 link tĩnh (đầu 25 + cuối 22) +
  phần giữa qua JSONP `/index.php?c=book&a=list.jsonp` (callback + book_id
  đọc từ list.html, `b` tính bằng cùng hàm base64; thiếu cookie/Referer trả
  "参数错误！6"), tìm kiếm `/index.php?c=book&a=search&keywords=` (95 kết
  quả cho "重生", không phân trang). Nếu sau này quanben.io mở lại được từ
  máy thật thì cần viết lại book/genre/detail/toc/search theo giao diện này
  (chap.js dùng chung được).

## So sánh 2 base

| | duongden v5 | hajljnopera v3 |
|---|---|---|
| src | MÃ HÓA (blob, `encrypt: true`) — không đọc/không dùng được | Mở, đọc được |
| script | home/detail/toc/chap (+ config select 2 domain) | home/detail/toc/chap + gen.js + libs.js |
| home | (trong zip mã hóa) | 18 tab thể loại tĩnh → gen.js |
| detail/toc/chap | (trong zip mã hóa) | Dùng API cũ `Http.get`/`Console.log`, toc/chap chạy qua `Engine.newBrowser()` + click JS |
| gen.js | — | List thể loại qua `Http.get`, phân trang `span.cur_page` |

Bản port lấy ý tưởng cấu trúc từ hajljnopera (tab thể loại, selector danh
sách, TOC qua `load_more` + JSONP trên giao diện cũ) nhưng viết lại hoàn
toàn theo hợp đồng hiện tại (`fetch` + `pacedFetch`, `Response.error`
tiếng Việt, `safeFirst`, `config.js` + `rate-limit.js`, không dùng browser
vì HTML đã tĩnh đủ) và chuyển sang giao diện quanben5.com.

## Thiết kế (quanben5.com)

- `home.js`: 6 tab tĩnh (玄幻/都市/仙侠/言情/穿越/历史) → `book.js`.
- `genre.js`: đọc 16 thể loại từ menu trang chủ → `book.js`.
- `book.js`: renderer danh sách chung (`div.pic_txt_list`), phân trang "下一页".
- `search.js`: JSONP `/?c=book&a=search.json` + `qbBase64`, parse content HTML.
- `detail.js`: h1 / `.pic_txt_list` đầu tiên / `p.info` / `div.description`.
- `toc.js`: `xiaoshuo.html` tĩnh, sắp theo số chương trong URL.
- `chap.js`: `#content` trừ `#ad`, tiêu đề = đoạn `<p>` đầu tiên.

## Kết quả test

Test trên máy thật (HONOR PTP-AN10, 2026-11-12 ~17:30): **7/7 case code 0**,
log `~/workspace/vbook/work/ext-review/quanben-device-test.log` —
home 6 tab, genre 16 thể loại, book `/category/1.html` 18 truyện
(data2 → `/category/1_2.html`), search "傲世丹神" 1 kết quả, detail
傲世丹神 đầy đủ (tác giả 寂小贼, Hoàn thành, ongoing=false), toc 3.813 chương,
chap ch.1 61 đoạn `<p>`, tiêu đề 第1章 地狱灵芝, không còn `<span id="ad">`.
Cài lên máy `[install] OK code=200`. Chưa merge — chờ Anh test trong app
và nói merge.

## Attribution

- Ý tưởng cấu trúc + selector gốc: hajljnopera (repo `vbook-ext_hajljnopera`,
  extension `quanben` v3, không có LICENSE riêng — chỉ mượn pattern, code
  viết lại hoàn toàn).
- Mirror quanben5.com: ghi nhận từ metadata bản duongden v5 (repo
  `vbook_duongden`, có LICENSE MIT — xem file LICENSE của repo đó).
- Tác giả extension này: MuseAi.
