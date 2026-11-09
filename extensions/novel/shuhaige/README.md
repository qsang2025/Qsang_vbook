# 书海阁 (shuhaige.tw) — Truyện chữ giản thể miễn phí

Extension vBook đọc truyện chữ tiếng Trung giản thể từ **https://www.shuhaige.tw**
(书海阁). Chuyên: **huyền huyễn** (玄幻奇幻), **võ hiệp / tiên hiệp** (武侠仙侠),
**đô thị** (都市生活), **lịch sử** (历史军事), **khoa huyễn** (科幻未来),
**ngôn tình** (古代言情 / 现代言情 / 幻想奇缘 …), cùng trò chơi, kinh dị, truyện khác.

## Vì sao chọn nguồn này

Khảo sát ngày 2026-11-07 (kiểm chứng live bằng curl từ VM + test trên điện thoại thật):

- **UTF-8, HTML SSR thuần** — không mã hóa chương, không cần browser
  fallback. Type `novel`, locale `zh_CN`.
- **Đủ 16 thể loại** (`genre.js`, theo nav trang chủ + `/sort.html`):
  xuanhuan 玄幻奇幻, wuxia 武侠仙侠, dushi 都市生活, lishi 历史军事,
  youxi 游戏竞技, kehuan 科幻未来, xuanyi 恐怖悬疑, qita 其他类型,
  guyan 古代言情, xianyan 现代言情, huanqing 幻想奇缘, zongcai 游戏情缘,
  qingchun 浪漫青春, wangluo 言情美文, mmkehuan 科幻灵异, mmqita 其他类型.
- **Miễn phí, không khóa chương VIP** — bằng chứng:
  - 大道主 (id 649, tác giả 飘荡的云, 已完结, 1086万字): mục lục **3.094 chương**,
    chương 3094 đọc đủ 5 trang con (~7.100 ký tự), bắt đầu
    "不过就算是夕月道人没有前来…"; chương 1 (3 trang con) và chương 1
    《剑动九天》 (2 trang con) đọc đủ.
  - Không thấy chuỗi VIP / 付费 / 订阅 / 锁定 trên các trang
    detail / toc / chap đã kiểm tra.
- **HTTP 200 từ VM**, không login, không CAPTCHA, không Cloudflare.
  Không xoay User-Agent (AGENTS.md quy tắc 10).

## Cấu trúc site (đã xác minh)

- Trang chủ: `https://www.shuhaige.tw/` — 16 link thể loại ở nav, các mục
  nổi bật dùng chung layout `div.item`.
- Trang chi tiết: `/{id}.html` — ưu tiên meta OG
  (`og:novel:book_name`, `og:novel:author`, `og:novel:category`,
  `og:novel:status`, `og:novel:latest_chapter_name`,
  `og:novel:latest_chapter_url`, `og:novel:update_time`, `og:image`);
  fallback DOM: `#bookinfo .booktitle > h1`, `#bookinfo span#author > a`,
  `#bookinfo #bookimg > img` (cover 170×228, host `shuhaige_tw.tupianxs.com`),
  `#bookinfo .count li > span` (thứ tự cố định: 状态 / 字数 / 点击 / 推荐 /
  收藏 — 3 số sau luôn = 0, KHÔNG dùng), `#bookinfo #bookintro > p` (BỎ
  `<p>` ĐẦU TIÊN — DMCA đỏ "如果此书侵犯了您的权益…", từ `<p>` thứ 2 mới là
  mô tả thật), `#bookinfo .new > span.keywords > a` (chương mới nhất),
  breadcrumb thể loại `div.tabstit > a[href="/<slug>/"]`. OG category có hậu
  tố (vd 都市生活) — chuẩn hóa trước khi tra slug. KHÔNG có tổng số chương
  trên detail.
  - LƯU Ý cover: `absUrl()` của khung xương viết lại mọi host tuyệt đối về
    `BASE_URL`, nên cover OG trên CDN `tupianxs.com` được trả về dạng
    `https://www.shuhaige.tw/{id}/{cover}.jpg` — đã kiểm chứng URL này
    trả HTTP 200 từ VM nên dùng được.
- Mục lục — ĐIỂM ĐẶC THÙ: `/{id}/` 1 TRANG DUY NHẤT, không phân trang, không
  cần `page.js`. Toàn bộ chương trong một `<dl>`: `dt[0]` là chương mới nhất
  (12 `<dd>` giảm dần) + `dt[1]` "章节列表" (toàn bộ tăng dần). Tổng 3.106
  `<dd>` nhưng chỉ 3.094 href duy nhất. Runtime vBook KHÔNG có
  `children()` / `tagName()` / `parent()` trên Element nên `toc.js` KHÔNG
  đếm `<dt>` được — thay vào đó lấy tất cả `dl dd a` theo thứ tự DOM rồi
  dedupe GIỮ LẦN XUẤT HIỆN CUỐI (quét ngược từ cuối lên rồi đảo lại), vì
  phần dưới trang là danh sách đầy đủ tăng dần. (Kiểm chứng 2026-11-09:
  đúng 1 `<dl>` với 2 `<dt>`; 12 href lặp lại chính là 12 chương mới nhất
  3083–3094; giữ lần đầu sẽ cho thứ tự sai 3094…3083, 1…3082, nên giữ lần
  cuối là đúng. Nếu mục lục hiện sai thứ tự thì kiểm tra thứ tự 2 khối
  `<dt>` trên trang TOC trước.) App strip trailing `/`
  khỏi URL arg nên `toc.js` nhận `/649` vẫn phải tự thêm `/` trước khi fetch.
- Chương: `/{id}/{cid}.html` — tiêu đề `div.bookname > h1` dạng
  "第3094章 见识  1/5" (strip phần "  N/M"); nội dung `div#content`, các
  đoạn là `<p>`. CHƯƠNG CHIA NHIỀU TRANG CON: `div.bottem1` có
  `a#pager_next` — text quyết định: "下一页" → trang con tiếp
  `/{id}/{cid}_{k+1}.html` (`_2.html`…`_5.html`; `_1` không tồn tại);
  "下一章" → href `/{id}/end.html` là SENTINEL GIẢ — DỪNG, KHÔNG fetch nó.
  `chap.js` loop tối đa 10 trang con, nối đủ nội dung. (Kiểm chứng
  2026-11-09: mẫu 49 chương rải khắp 《大道主》 tối đa 5 trang con/chương,
  chương 3094 đi hết chuỗi 1/5 → 5/5 rồi pager đổi thành 下一章 →
  `end.html`; cap 10 là lưới an toàn gấp đôi số lớn nhất quan sát được,
  vòng lặp dừng ở sentinel nên không treo; nếu chương vượt 10 trang thì
  log cảnh báo và nội dung thiếu phần sau.) Lọc rác trong
  `#content` theo NỘI DUNG: `<p>` DMCA đầu tiên, "小主子，这个章节后面还有哦
  ^.^，请点击下一页继续阅读，后面更精彩！", "本小章还未完~.~，请点击下一页
  继续阅读后面精彩内容！", "无错的章节将持续在…", "请大家收藏：(shuhaige.tw)".
- Danh sách thể loại: trang 1 `/<slug>/` có 6 `div.item` nổi bật
  (`div.image > a > img` cover trực tiếp, `dl > dt > span` tác giả +
  `dt > a` tên, `dl > dd` mô tả); trang N≥2 `/<slug>/<N>.html` layout bảng
  `div.novelslist2 > ul > li` (`span.s1` [thể loại], `span.s2 > a` tên,
  `span.s3 > a` chương mới, `span.s4 > a` tác giả, `span.s5` số chữ,
  `span.s6` trạng thái, `span.s7` thời gian). KHÔNG có link phân trang trên
  trang → tự đoán URL `/<slug>/<N>.html` và DỪNG KHI LIST RỖNG (title
  "列表N" clamp ở 5, không đáng tin; trang rỗng vẫn 200). Ví dụ xuanhuan
  p2 = 31 sách, p3 rỗng; dushi p2 = 50, p3 = 16, p4 rỗng (đã kiểm chứng
  trên điện thoại).
- Bảng xếp hạng: `/allvisit/`, `/allvote/`, `/goodnum/`, `/lastupdate/` dùng
  chung layout `div.novelslist2` (50 dòng/trang); phân trang
  `/allvisit/<N>.html` (p2 = 50 dòng, đã kiểm chứng). `/quanben/` là trang
  tổng hợp 6 mục (`div.novelslist > div.content > div.top` + 6 `<ul>` danh
  sách, 112 truyện duy nhất), KHÔNG phân trang (`/quanben/2.html` chỉ trả
  14B) — `book.js` chỉ lấy trang 1, token trang kế luôn `""`.
- Tìm kiếm — ĐANG HỎNG (xem Maintenance watch): form POST `/search.html`
  (`searchtype=all` + ô text `name="369koolearn"`).

## Maintenance watch

- **Tìm kiếm HỎNG — backend site không trả kết quả (2026-11-07, test trên
  điện thoại thật HONOR PTP-AN10)**: POST `/search.html` (`searchtype=all` +
  `369koolearn=大道主`), POST `searchtype=articlename`, GET cả hai biến thể,
  POST/GET qua `m.shuhaige.tw`, và POST có cookie session `v=…` + timeout
  60s — TẤT CẢ đều trả HTTP 200 nhưng chỉ có vỏ trang (title "sodu小说搜索",
  body text 433 ký tự, không chứa "大道主", không có kết quả). Trang search
  không có JS nào tải kết quả (`/tpl/pc/js/common.js` chỉ `document.writeln`
  form; `/WordPress/Plugins/App.js` 14B rỗng). `search.js` giữ nguyên 3 tầng
  thử (POST → GET → mobile) và trả lỗi tiếng Việt rõ ràng khi không có kết
  quả — KHÔNG tự ý drop search, KHÔNG bịa selector. Cần kiểm tra lại bằng
  trình duyệt thật (POST form tay) hoặc khi site sửa backend; fixture
  `search.js` trong `test.json` sẽ FAIL cho tới lúc đó.
- **Kiểm tra lại 2026-11-09: vẫn hỏng.** Thử lại toàn bộ biến thể: GET
  `searchtype=articlename/all/author`, POST `all`/`articlename`, GET qua
  `m.shuhaige.tw`, từ khóa ngắn `剑`, tìm theo tác giả `飘荡的云` — tất cả
  trả HTTP 200 nhưng chỉ là vỏ trang (title `sodu小说搜索`, ~6,0KB GET /
  ~5,8KB POST, 0 kết quả, không chứa từ khóa). Form tìm kiếm trên trang chủ
  không đổi (POST `/search.html`, `searchtype=all` ẩn + ô `369koolearn`);
  trang kết quả không có JS nào tải kết quả (chỉ jQuery, `common.js`,
  `App.js`). Kết luận: backend tìm kiếm của site vẫn chưa sửa — `search.js`
  giữ nguyên 3 tầng thử và lỗi tiếng Việt rõ ràng, KHÔNG giả vờ sửa; case
  search trong `test.json` vẫn FAIL cho tới khi site sửa backend. Hướng
  fallback qua nguồn khác (tìm slug truyện rồi map về shuhaige.tw) cần
  quyết định của Anh vì đổi kiến trúc tìm kiếm — chưa làm.
- **Mirror `.net` CHẾT (2026-11-07, test trên điện thoại thật)**:
  `https://www.shuhaige.net/` và `https://m.shuhaige.net/` đều trả HTTP 504
  (từ VM: 000/exit 52). `MIRRORS` giữ mặc định `""` (như sto9); nếu sau này
  `.net` sống lại với đúng nội dung thì thêm vào config.
- **Truyện đang 連載, số chương tăng theo ngày**: fixture `toc.js` dùng
  `minItems: 3000` (đếm được 3.094 mục ngày 2026-11-07 cho truyện đã hoàn
  nên số này không đổi; với truyện đang ra thì nới lỏng tương tự).
- **Nội dung trang thể loại đổi theo ngày** (truyện mới đẩy trang cũ xuống):
  fixture `book.js` dùng tên truyện đang có trên trang 1 ngày 2026-11-07
  (`剑动九天`); nếu case này hỏng thì đổi tên theo trang hiện tại.
- **Trang rỗng vẫn 200**: `book.js` dừng khi list rỗng — không dựa vào
  title "列表N" hay status code để biết hết trang.
