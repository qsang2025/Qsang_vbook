# 思兔閱讀 (sto9.com) — Truyện chữ phồn thể miễn phí

Extension vBook đọc truyện chữ tiếng Trung phồn thể từ **https://sto9.com**
(思兔閱讀 — "Tư Thố Duyệt Độc"). Chuyên: **huyền huyễn** (玄幻奇幻),
**võ hiệp / tiên hiệp** (武俠仙俠), **đô thị** (現代都市), **khoa huyễn**
(科幻小說), **ngôn tình** (言情小說), cùng lịch sử, trò chơi, kinh dị,
đồng nhân, truyện khác.

## Vì sao chọn nguồn này

Khảo sát ngày 2026-11-07 (kiểm chứng live bằng curl từ VM):

- **UTF-8, HTML SSR thuần** — không mã hóa chương, không cần browser
  fallback. Type `novel`, locale `zh_TW`.
- **Đủ 11 thể loại** (`genre.js`): 0 全部分類, 1 玄幻奇幻, 2 武俠仙俠,
  3 現代都市, 4 歷史軍事, 5 科幻小說, 6 遊戲競技, 7 恐怖靈異,
  8 言情小說, 9 動漫同人, 10 其他類型. Mỗi trang thể loại 15 truyện,
  class 0 có 16 trang.
- **Miễn phí, không khóa chương VIP** — bằng chứng:
  - 夜無疆 (id 671, tác giả 辰東, 連載, 521.47萬字): mục lục **873 mục**
    qua endpoint AJAX, chương 1 đọc được toàn văn, bắt đầu
    "那一天太陽落下再也沒有升起……"; chương 870 (~5.500 ký tự) đọc đủ.
  - Không thấy chuỗi VIP / 付费 / 订阅 / 锁定 trên các trang
    detail / toc / chap đã kiểm tra.
- **Tìm kiếm hoạt động**: GET `/search/{từ-khóa}/{page}.html`, không cần
  POST. Tìm "辰東" trả 3 kết quả (夜無疆 連載, 聖墟 全本, 完美世界 全本).
- **HTTP 200 từ VM**, có Cloudflare phía trước nhưng curl vẫn vào được,
  không login, không CAPTCHA. Không xoay User-Agent (AGENTS.md quy tắc 10).

## Cấu trúc site (đã xác minh)

- Trang chủ: 10 truyện nổi bật (`.newnovels li`). `/novels/hot`: 30 truyện.
  `/last` (mới cập nhật): 40 truyện. `/all.html`: 1.098 truyện trên 1 trang,
  không phân trang.
- Trang chi tiết: `/book/<id>.html` — ưu tiên meta OG
  (`og:novel:book_name`, `og:novel:author`, `og:novel:category`,
  `og:novel:status`, `og:novel:latest_chapter_name`,
  `og:novel:latest_chapter_url`, `og:novel:update_time`, `og:book_id`,
  `og:image`); fallback DOM: h1 trong `.booknav2`, `.bookbox .bookimg2 img`
  (cover), `.booknav2 p` (作者/分類/狀態/字數/更新), `div.navtxt` (mô tả).
  Truyện hoàn mẫu: `/book/533.html` 天才俱樂部 (全本).
- Mục lục — ĐIỂM ĐẶC THÙ: trang `/book/{id}/index.html` CHỈ chứa 36 link
  (15 đầu + 21 cuối), KHÔNG phân trang. Full list ở endpoint AJAX
  `GET /ajax_novels/chapterlist/{id}.html` (200, text/html UTF-8, ~104KB,
  fragment `<ul>` đủ 873 `<li data-num="1..873">`). `toc.js` fetch endpoint
  AJAX này; trang index chỉ làm fallback. ID chương là số mờ
  (83151 cho chương 1) — KHÔNG sort theo số trong URL, giữ đúng thứ tự DOM.
  `toc.js` lọc bỏ mục ghi chú của tác giả không phải chương (cảm ơn /
  nghỉ / xin phép / xin phiếu /抽獎 /感言 / sách mới — chỉ lọc mục không
  đánh số "第…章", mục 番外/終章/後記… luôn giữ). Không cần `page.js`.
- Chương: `/txt/{id}/{cid}.html` — tiêu đề `div.txtnav > h1`; nội dung là
  text node trực tiếp trong `div.txtnav`, đoạn cách nhau `<br /><br />`,
  thụt đầu dòng `&emsp;&emsp;`, KHÔNG có thẻ `<p>`. `chap.js` bỏ h1 +
  div quảng cáo (`div.txtright`, `div.txtad`, `div.txtcenter`) và lọc
  dòng quảng cáo theo tên miền: chuẩn hóa đoạn (bỏ ký tự không phải
  chữ/số, loại cả emoji chèn giữa "st☕o9"/"sto9🍀.com") rồi tìm "sto9" /
  "o9com" — câu quảng cáo đổi liên tục nhưng đoạn nào cũng chứa tên miền;
  3 chuỗi cũ ("提醒您查看最新內容", "(還有更新耶)", "閱讀更多內容")
  giữ lại làm phòng thủ thêm. Không chia nhiều trang chương
  (không có link 下一页 / 下一頁 trên trang chương — chỉ có 下一章
  là chương kế — nên `chap.js` không có nhánh theo trang phụ).
- Danh sách thể loại: `/novels/class/{id}_{page}.html`, item
  `ul#article_list_content > li`: cover ở `data-src` (lazy-load, `src`
  chỉ là `/images/nocover.jpg`), tên `.newnav h3 a`, `.labelbox label` ×3
  = tác giả / thể loại / trạng thái, `ol.ellipsis_2` mô tả,
  `.zxzj a` chương mới nhất.
- Phân trang: pager KHÔNG có chữ 下一頁 — nút trang kế là
  `<a class="next">` (chữ ">"). `book.js` / `search.js` trả token trang kế
  là PATH của link kế (vd `/novels/class/0_6.html`); lượt sau nhận `page`
  bắt đầu bằng "/" thì fetch thẳng path đó. Pattern trang sau (để tham khảo):
  class `/novels/class/{id}_{N}.html`, hot `/novels/newhot_0_0_{N}.html`,
  full `/novels/full/0_{N}.html`; `/last` và `/all.html` không phân trang.
  `/last` dùng cấu trúc `.recentupdate2 li` (không cover),
  `/all.html` dùng `.ranking a[href*="/book/"]` (chỉ tên + link).
- Tìm kiếm — ĐIỂM ĐẶC THÙ: từ khóa khớp đúng 1 truyện sẽ redirect thẳng
  về trang chi tiết `/book/{id}.html` — `search.js` nhận ra bằng meta
  `og:novel:book_name` và trả 1 kết quả duy nhất lấy từ OG meta.

## Maintenance watch

- **Truyện đang 連載, số chương tăng theo ngày**: fixture `toc.js`
  dùng `minItems: 800` (đếm được 873 mục ngày 2026-11-07), không khóa
  cứng 873.
- **Nội dung trang thể loại đổi theo ngày** (truyện mới đẩy trang cũ
  xuống): fixture `book.js` dùng tên truyện đang có trên trang 5 ngày
  2026-11-07; nếu case này hỏng, đổi tên theo trang hiện tại (xem ghi
  chú trong `test.json`).
- **Thể loại của truyện có thể sai trên site**: `og:novel:category` và
  breadcrumb của một số truyện có thể lệch (biquge từng gặp trường hợp
  tương tự) — `detail.js` lấy theo link `/novels/class/` trong
  `.booknav2` trước, OG chỉ làm fallback; đối chiếu breadcrumb với OG
  category khi test.
- **Chưa có mirror nào đã biết**: `config.MIRRORS` mặc định rỗng,
  không bịa mirror. Nếu `sto9.com` chết, tìm mirror thật rồi mới thêm.
- **Icon**: `icon.png` là favicon thật của site (`/favicon.ico`,
  thực chất là PNG 128×128) resize lên 200×200.
- **Test trên máy thật**: chạy `node scripts/cli.js testall
  extensions/novel/sto9` (xem `test.json` — golden cases với
  夜無疆 thật). Chưa test trên điện thoại ở version 1 — xem mục dưới.

## Trạng thái version 2

- **Đã test xong trên điện thoại thật (Magic7 Pro, 2026-11-07)**: detail /
  toc (873 chương) / chap 1 + chap 850 / search (redirect 1 kết quả +
  辰東 3 kết quả) / genre (11) / home (9 tab) / book class 0_5 (15) /
  hot (30) / last (30, không cover) / all.html (1.098) / full (15) +
  token phân trang đi-về (class 0_6, search 完美世界 trang 2) — tất cả
  PASS. `testall --query 夜無疆`: WORK.
- **Lỗi đã sửa ở v2** (`helper.js` `parseBookItem`): `<a class="imgbox">`
  bao cả `<div class="newnav">` nên `<a>` trong `<h3>` là `<a>` lồng nhau;
  jsoup tách thành 2 `<a>` trong h3 (một `<a class="imgbox">` rỗng +
  `<a>` thật) và `.first()` trúng cái rỗng → tên "" → book/search trả
  rỗng trên máy thật (curl không thấy vì HTML thô chỉ có 1 `<a>`).
  Fix: chọn `<a>` đầu tiên có text trong h3.
- **Lưu ý khi test**: chạy test qua `scripts/cli.js` PHẢI kèm
  `NODE_OPTIONS="--require /home/hatch/workspace/vbook/proxy-preload.js"`
  (không có preload thì CLI nối thẳng tailnet IP và báo "socket hang up"
  dù máy vẫn trả `/connect` 200 qua proxy 3130).
- `/last` live chỉ có 30 truyện (không phải 40 như khảo sát ban đầu);
  cover fallback nocover chưa có truyện mẫu để test trực tiếp trên máy
  (logic đã đối chiếu code với `coverFromImg` đã chứng minh trong book.js).
