# 小說狂人 (czbooks.net)

Extension vBook type `novel`, locale `zh_TW`, cho truyện chữ phồn thể miễn phí
tại https://czbooks.net — 120k+ truyện, đọc miễn phí, không khóa VIP.

## Site facts (khảo sát + test trên máy thật 2026-11-07)

- Chỉ dùng domain trần `https://czbooks.net` (www chết, http 301 lên https).
  Không cần login. Cover không cần Referer.
- SSR hoàn toàn, không chống bot, không mã hóa. Toàn bộ trang đã kiểm tra
  đều HTTP 200 (kể cả 25 slug thể loại).
- **Tìm kiếm:** URL dạng path `/s/{từ khóa}` (KHÔNG phải query string;
  `/search?q=…` và `/s?q=…` đều 404). Khớp cả tên truyện và tên tác giả.
  Phân trang `/s/{kw}/{page}`, pager `ul.nav.paginate`.
- **Detail:** `div.info-wrap > div.info > h1.title` (tên gồm cả 《》),
  `span.author > a`, `div.thumbnail > img`, `div.info-wrap > div.description`,
  bảng trạng thái `div.state > table` (連載狀態 / 收藏數 / 觀看數 / 更新時間 /
  分類 `a#novel-category`). Số chương = đếm link TOC ngay trong trang chi
  tiết (`ul#chapter-list > li > a`, cùng selector với `toc.js`, không tốn
  thêm request), hiển thị thành dòng `章節數：N` trong detail — trang chi
  tiết không có trường số chương riêng ("共 N 章" không tồn tại, đã kiểm
  chứng 2026-11-09). URL chi tiết có dấu `/` cuối bị site trả 404
  (`/n/s6pbed/` → 404, `/n/s6pbed` → 200) nên `detail.js`/`toc.js`/
  `chap.js` và link trong danh sách đều strip dấu `/` cuối của URL `/n/...`
  trước khi fetch (xem `helper.js` `stripNovelTrailingSlash()`).
  Age-gate overlay `#__ageGate_overlay__` luôn hidden, không chặn.
- **TOC:** nằm ngay trong trang sách, không endpoint riêng, không phân trang
  (kể cả 1.411 chương). `ul#chapter-list > li > a[href="//czbooks.net/n/{book}/{slug}?chapterNumber={N}"]`.
  `li.volume` là tiêu đề quyển (dữ liệu quyển có lỗi sẵn trên site) — bỏ qua.
- **Chương:** `div.chapter-detail > h1.name` (dạng 《書名》章名),
  `div.chapter-detail > div.content` — chỉ text + `<br />`, không script/quảng
  cáo, đoạn tách bằng `<br /><br />`, đầu đoạn thụt 2 ký tự toàn giác.
  Không phân trang chương.
- **Thể loại:** `genre.js` lấy ĐỘNG từ menu thể loại trên trang chủ
  (`ul.site-desktop-menu`, link `//czbooks.net/c/{slug}`) — kiểm chứng
  2026-11-09: đủ 25 mục; nếu fetch hỏng hoặc parse được < 10 mục thì
  fallback về bảng cứng 25 mục trong `genre.js` (slug lệch tên hiển thị,
  không suy từ tên). Trang thể loại `/c/{slug}` mặc định sort 最新,
  phân trang `/c/{slug}/{page}`; sort `/new /day /week /total /finish`,
  phân trang `/c/{slug}/{sort}/{page}`. Bảng xếp hạng
  (`/c/normal, /c/all, /c/favorite, /c/finish, /c/hot`) mặc định `/day`,
  chỉ có day/week/total. Không có mục 都市 riêng.
- **Home:** 4 tab tĩnh trỏ về `book.js`: 精選排行 `/c/normal/day`,
  人氣榜 `/c/all/day`, 完本榜 `/c/finish/day`, 收藏榜 `/c/favorite/day`.
  Không đưa `/c/hot` (工口榜) vào home mặc định.

## Quirk đã biết

1. **Search cần phồn thể.** Tìm giản thể (vd `剑来`) cho kết quả thiếu/sai,
   tìm phồn thể (`劍來`) mới đúng. Extension dùng query nguyên văn, không làm
   bảng convert giản→phồn (quá lớn). Lưu ý: với từ khóa `谁让他修仙的`
   (giản thể) đã kiểm chứng vẫn trả đúng 40 item, truyện đầu tiên đúng —
   quirk không ảnh hưởng mọi từ khóa, nhưng dùng phồn thể luôn an toàn hơn.
2. **`?chapterNumber` bị site lờ đi hoàn toàn** (kiểm chứng:
   `/n/s6pbed/s6lc7698?chapterNumber=5` vẫn trả 第1章). `toc.js` cắt bỏ query,
   chỉ giữ path `/n/{book}/{slug}` — không bao giờ tự dựng URL bằng chapterNumber.
3. **Link protocol-relative.** Site dùng `//czbooks.net/...` khắp nơi;
   `absUrl()` của lib không nhận dạng dạng này (sẽ ra URL nhân đôi host),
   nên `helper.js` có `resolveHref()` thêm `https:` trước rồi mới gọi `absUrl`.
4. **Số item/trang khác nhau theo client.** Trang tìm kiếm: 40 item trên điện
   thoại vs 42 qua curl desktop. Trang thể loại: 42 item trên điện thoại vs
   72 qua curl desktop. Cả hai đều là đủ 1 trang (đã kiểm chứng bằng script
   debug đếm wrapper trên máy thật: 40/40 và 42/42 parse đủ, không thiếu item).
5. **Cover mặc định.** Truyện chưa có cover thật dùng
   `/images/default_no_thumbnail.jpg` — `coverFromImg()` trả `""` cho trường
   hợp này. Cover thật có 2 dạng: `https://img.czbooks.net/thumbnail/{md5}.jpg|png`
   (có thể kèm query `?timestamp`) và dạng cũ `https://czbooks.net/{n}/{id}s.jpg`.
6. **Tên truyện trùng nhau.** Nhiều truyện khác nhau có thể cùng tên
   (vd 3 bản 《誰讓他修仙的！》 với slug khác nhau) — dedupe theo link, không
   theo tên.
7. **Thẻ `<a>` lồng nhau.** Như bài học sto9: khi chọn link trong danh sách,
   chỉ lấy `<a>` có href khớp `/n/{slug-truyện}` (không lấy link chương mới
   `/n/{slug}/{chương}`). Không dùng `.parent()`.

## NSFW

`nsfw: true` trong manifest — catalog có lẫn nội dung NSFW: thể loại
情色工口 `/c/herotic`, 耽美工口 `/c/blerotic`, 耽美 `/c/danmei`,
百合 `/c/baihe`, và bảng 工口榜 `/c/hot`. Các mục này có trong `genre.js`
(vì đó là thể loại thật của site) nhưng `/c/hot` không có trong home mặc định.
Quyết định theo user 2026-11-07 (giữ NiACG trong shared catalog với nsfw flag).

## Quyết định đã làm

- Bộ 7 script như sto9 (đã chứng minh trên máy thật):
  `home / genre / search / detail / toc / chap / book` (+ `helper.js` riêng).
- **Xóa** `page.js` (TOC không phân trang) và `explore.js` (không dùng),
  khóa cả hai khỏi manifest. **Xóa** `cleanHtml.js` (nội dung chương đã sạch,
  không script/quảng cáo, không cần lib này) — không để file mồ côi trong `src/`.
- `chap.js`: bỏ dòng đầu chỉ khi trùng đúng tên chương; strip `(本章完)` ở cuối.
- `detail.js`: không có `suggests` (mục "其他人也看了這些" là HTML tĩnh trong
  trang detail, không có script list riêng theo bộ 7 script).
- Mirror: chưa xác minh được mirror nào của czbooks.net nên `MIRROR_LIST`
  mặc định rỗng; `fetchWithFallback()` vẫn sẵn sàng khi có mirror thật.

## Truyện mẫu (test)

- Detail/TOC: https://czbooks.net/n/s6pbed — 《誰讓他修仙的！》, tác giả
  最白的烏鴉, 已完結, 1.411 chương, 30537 收藏 / 3601386 观看.
- TOC không query: https://czbooks.net/n/u3h23 — 《詭秘之主》, 1.449 chương.
- Chương: https://czbooks.net/n/s6pbed/s6lc7698 (第1章),
  https://czbooks.net/n/s6pbed/bliod (番外三).
- Tìm kiếm: `/s/誰讓他修仙的` (40 item/trang trên máy thật).
- Thể loại: `/c/xuanhuan`, bảng `/c/normal/day`.
