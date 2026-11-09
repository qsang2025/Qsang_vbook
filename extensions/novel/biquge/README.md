# 笔趣阁 (biquge.tw) — Truyện chữ giản thể miễn phí

Extension vBook đọc truyện chữ tiếng Trung giản thể từ **https://www.biquge.tw**
(笔趣阁 — "Bút Thú Các"). Chuyên: **tu tiên / tiên hiệp** (武侠修真),
**đô thị** (都市言情), **võng du** (游戏竞技), cùng huyền huyễn, lịch sử,
khoa huyễn, nữ sinh, truyện khác.

## Vì sao chọn nguồn này

Khảo sát ngày 2026-11-06 (kiểm chứng live bằng curl từ VM):

- **UTF-8, HTML SSR thuần** — không mã hóa chương (khác novels.com.tw),
  không cần browser fallback. Type `novel`, locale `zh_CN`.
- **Đủ 3 thể loại yêu cầu**: 武侠修真 (chứa tu tiên/tiên hiệp),
  都市言情 (đô thị), 游戏竞技 (võng du) — xem `genre.js` (đủ 8 thể loại).
- **Miễn phí, không khóa chương VIP** — bằng chứng:
  - 凡人修仙传 (id 199376, tác giả 忘语, 全本, 1118万字): tiêu đề trang
    ghi "全文免费在线阅读"; mục lục **2620 chương trên 1 trang**, không
    phân trang; chương 1 đọc được toàn văn 2427 ký tự, bắt đầu
    "二愣子睁大着双眼，直直望着茅草…".
  - 异界龙神 (id 9002): mục lục 1869 chương, chương cuối đọc được toàn văn.
  - Không thấy chuỗi VIP / 付费 / 订阅 / 锁定 / 购买 trên các trang
    detail / toc / chap đã kiểm tra.
- **Tìm kiếm hoạt động**: `/search/?searchkey=<từ khóa>`, 500 kết quả cho
  "凡人修仙传", có phân trang (`&page=2`, link 下一頁).
- **HTTP 200 từ VM**, không bị Cloudflare chặn (khác novels.com.tw).
  Lưu ý: nếu IP của máy bị challenge, `fetch-helpers.js` có sẵn
  `fetchViaBrowser` + nhận diện title "Chờ một chút".

## Cấu trúc site (đã xác minh)

- Trang chi tiết: `/book/<id>.html` — `h1 a` tên, `h2 a[href*="/author/"]`
  tác giả, `img[src*="img.biquge.tw"]` cover, `div.intro` mô tả,
  breadcrumb `.navigator` link `/sort/` thể loại, meta
  `og:novel:status` / `og:novel:lastest_chapter_name`.
- Mục lục: `/book/<id>/` — 1 trang duy nhất, selector
  `.list-chapter .booklist ul li a` (không cần `page.js`).
- Chương: `/book/<id>/<so>.html` — nội dung trong
  `#chaptercontent` (các `<p>`); H1 có hậu tố `（N / M）` là số trang
  của chương — các chương đã kiểm tra đều `(1 / 1)`, `chap.js` vẫn theo
  link 下一页 nếu chương bị chia trang.
- Danh sách thể loại: `/sort/<slug>/`, trang N là `/sort/<slug>/N.html`
  (pager có 下一页 / 末页, vd 游戏竞技 20 trang). Item `.item`:
  cover `img.lazy[data-src]`, tên `dt a`, tác giả `dd.author`,
  mô tả `dd.intro`, tag `.cover span` (vd "游戏 / 全本").

## Ứng viên đã loại

- **qidian.com** — loại theo yêu cầu (khóa chương VIP / trả phí).
- **novels.com.tw** — loại theo yêu cầu (đã có trong repo; phồn thể +
  chương mã hóa AES).
- **biqugeabc.com** — chết (curl code 000).
- **xbiquge.so** — bị chặn 403 từ VM.
- **mibiquge.com → mibiquxs.com** — sống (200) nhưng chỉ có 3 thể loại
  chính (玄幻/武侠仙侠/都市), không có mục võng du riêng; làm dự phòng.
- **69shuba.com** — sống (200) nhưng charset **GBK** (phải dùng type
  `chinese_novel` + giải mã GBK, nặng hơn) và cấu trúc thể loại/tìm kiếm
  không rõ bằng biquge.tw; làm dự phòng.

## Maintenance watch

- **v4 (2026-11-09, review 2026-11-08)**: `toc.js` / `search.js` /
  `book.js` fetch qua `fetchPageDoc()` mới trong `helper.js`
  (`fetchDocWithFallback` + `fetchWithChallengeHandler`, lỗi tiếng Việt
  có hướng dẫn khi gặp Cloudflare/login); `chap.js` / `detail.js` /
  `toc.js` phân biệt trang lỗi "出错了" (HTTP 200) của site và báo
  "Chương/Truyện không tồn tại (link có thể đã đổi)"; link 下一页 /
  下一頁 tìm bằng `findLinkByText()` (duyệt `a` rồi so text) thay cho
  selector `a:contains(...)` chưa có bằng chứng runtime hỗ trợ. C2 đã
  kiểm chứng live: `/sort/wuxia/` (27 item, có link 下一页) và
  `/sort/wuxia/2.html` (27 item) đều 200 nên `detail.js` genres
  `input: /sort/<slug>/` + `book.js` không đổi. `src/fetch-helpers.js`
  đã md5 khớp `lib/` (N1 xong từ bước chung).
- **Thể loại của truyện có thể sai trên site**: `og:novel:category` và
  breadcrumb của 凡人修仙传 (id 199376) ghi 女生耽美 trong khi đó là
  truyện tu tiên — đây là lỗi dữ liệu của site (có nhiều bản copy cùng
  tên, id khác nhau). `detail.js` lấy theo breadcrumb/OG nên genres của
  một số truyện có thể lệch; không sửa được từ phía extension.
- **Domain biquge đổi thường xuyên**: nếu `www.biquge.tw` chết, kiểm tra
  domain mới và đổi `config.DOMAIN.default` + `metadata.source`
  (hiện chưa xác minh được mirror nào; `m.biquge.tw` là bản phồn thể,
  KHÔNG dùng làm mirror cho bản giản thể này).
- **Icon**: `icon.png` là favicon thật của site (`/fav.png`, 32×32)
  phóng lên 200×200.
- **Test trên máy thật**: chạy `node scripts/cli.js testall
  extensions/novel/biquge` (xem `test.json` — golden cases với
  凡人修仙传 thật).
