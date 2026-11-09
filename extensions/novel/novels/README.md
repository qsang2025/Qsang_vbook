# 繁體小說 (novels.com.tw)

Extension vBook cho site truyện chữ phồn thể **https://www.novels.com.tw**
(nguồn: 繁體小說). Type `novel`, locale `zh_TW`, UTF-8.

- Author: Qsang
- Version: 4 (2026-11-09, theo review ext: tripwire key AES C1,
  health.json case gfncgd.js + note WAF N2, ghi chú strip byte rác C2;
  N3 chương trả phí chưa xác minh được — xem mục Chương trả phí)
- Encrypt: false
- Khảo sát site: `~/workspace/vbook/novels-survey.md` (2026-11-06)

## Cấu trúc site

### Trang chi tiết (detail)

URL có 2 dạng:

- `/novels/no<slug>0/?aid=<n>` — ví dụ `nolongzuzhongqirensheng0`, aid=200,
  truyện 龍族：重啟人生, 477 chương.
- `/novels/no<64 ký tự hex>/?aid=<n>` — ví dụ aid=887602, 重生官場, 748 chương.

Selector (phạm vi `.novel_info_main`):

- Tiêu đề: `h1`
- Tác giả: `.novel_info_title i a[href^="/author/"]`
- Cover: `.novel_info_main > img[src]` (trang list/search dùng `img.lazy`
  với ảnh thật ở `data-original`; cover fallback
  `/static/shipsay/nocover.jpg` — đã có truyện thật bị 404 cover, ví dụ
  aid=887602)
- 3 span `.novel_info_title p span` = thể loại (lúc có lúc trống — để trống
  khi không có, không bịa) / số chữ / trạng thái (連載 / 完本 / 全本)
- Chương mới nhất: `.flex.to100 a` + ngày `em.s_gray`
- Chương đầu: `a.l_btn`
- Mô tả: `#info.intro` (HTML lồng `<p><p>`, jsoup đọc được)
- Tổng số chương: `a#a_catalog span` (ví dụ `（477章）`)
- Không có lượt xem. Fallback OG meta: `og:novel:author`,
  `og:novel:status`, `og:novel:book_name`.

### Mục lục (toc)

TOC nằm **ngay trên trang chi tiết**, không phân trang → **không có
page.js**. Hai khối: `.recent` (~12 chương mới nhất, thứ tự giảm dần — bỏ
qua) và `#catalog.chapters` (danh sách đầy đủ, thứ tự tăng dần).
Selector: `#catalog.chapters a`; fallback: gom mọi link
`/novels/<slug>/<số>.html`, dedupe theo URL, sắp theo số chương.

### Chương (chap) — giải mã AES

Nội dung chương **không có text trong HTML** — chỉ có blob base64 trong
`window.encryptedContent` ở `#chapter-content`. Đã kiểm chứng bằng Node
(WebCrypto) trên 5 blob thật:

- **AES-128-CBC, key `"WZc0cbzgY3lhz3X6"` (16 ký tự, dùng chung toàn site),
  IV 16 byte 0**, plaintext là HTML `<p>…</p>`.
- Cuối plaintext có padding PKCS#7 (16 × `0x10`) + vài byte rác
  (`\x01`–`\x10`) — cần strip.
- Blob chứa escape `\/` (base64 decoder phải bỏ qua `\`).
- Ciphertext cố định theo chương (fetch lại cho blob giống hệt).

`chap.js` tự viết **AES-128-CBC decrypt + base64-decode + UTF-8-decode
bằng JS thuần, phong cách Rhino ES6** (chỉ `var`/`function`, không
arrow/async/template literal/`?.`/`??`/spread; không có `crypto.subtle`,
không có `atob`). S-box tính từ phép toán trường GF(2^8), không gõ tay.

Một chương chia nhiều trang (`202559.html`, `_2`, `_3` — lấy từ
`<select id="pageselect">`; trang cuối thì `next_url` sang chương kế):
chap.js fetch trang 1 → đọc `#pageselect` lấy hết trang → fetch + giải mã
từng trang → nối lại. Tiêu đề chương từ H1, bỏ hậu tố `（N / M）`
(fallback `og:novel:chapter_name`).

**Maintenance watch:** nếu site xoay key, key mới nằm ở file
`/static/shipsay/js/gfncgd.js` tại chỗ gọi hàm giải mã (key hiện tại tìm
thấy ở đó). Triệu chứng key đổi: chap.js giải mã ra rác / lỗi padding.
Lúc đó cập nhật key trong `chap.js` (hằng `AES_KEY`) và test lại với blob
chương 1 truyện 龍族 (phải ra `<p>嗯，終於要上架了……`).

**Tripwire key (v4, C1):** `chap.js` có `verifyChapKey()` — giải mã mẫu
`KEY_CHECK_CIPHER` (bản mã của `"novels-key-check-v1"` bằng key hiện
tại); nếu mẫu giải sai thì trang 1 chương nào cũng sẽ báo rõ "Khóa giải
mã … đã thay đổi, extension cần được cập nhật" thay vì lỗi chung. Đã
kiểm chứng bằng Node với chính code AES trong file (giải đúng mẫu,
khóa sai trả rác). Giới hạn: tripwire này chỉ phát hiện key trong code
bị hỏng/lệch, không phát hiện site xoay key ngoài đời — việc đó do
case `gfncgd.js` trong `health.json` đảm nhiệm: probe tìm chuỗi key
(dạng literal hoặc `\uXXXX` escape) trong file JS của site; mất chuỗi
mà các case khác vẫn 200 thì key đã xoay. Key còn đúng tính đến
2026-11-09 (đã đối chiếu với file `gfncgd.js` live).

**Strip byte rác (v4, C2 — giữ nguyên):** regex `[\x01-\x10\r]+$` sau
khi strip padding PKCS#7 được giữ nguyên theo đề xuất review. Nó chạy
trên chuỗi đã giải mã UTF-8 nên chỉ khợp ký tự điều khiển U+0001–
U+0010/`\r` ở cuối; nội dung chương thật (chữ Hán/Latin, số, dấu câu)
không thể kết thúc bằng các ký tự này. Nếu một chương nào bị mất ký tự
cuối thì kiểm tra chỗ này đầu tiên.

### Chương trả phí (N3) — chưa xác minh được, chưa đánh dấu `pay`

Trong mục lục truyện 龍族：重啟人生 chỉ có 3 chương ghi `免費章節`
(ch.99, ch.110, ch.159) và chương mới nhất ghi `免費章`; các chương
khác không ghi nhãn. Truyện có chương `(周五上架)` (ch.87) nên sau
điểm đó các chương không nhãn nhiều khả năng là trả phí — nhưng
**chưa chứng minh được**: crawler không chạy JS giải mã của site nên
mọi trang chương (kể cả chương 1 miễn phí chắc chắn) đều chỉ hiện
placeholder `請前往www.novels.com.tw網站繼續全文閱讀`; test trên máy
qua dev server thì cả chương miễn phí (ch.99) lẫn chương không nhãn
(ch.100) đều lỗi giống hệt nhau ở bước fetch (HTTP 403, WAF chặn IP
máy qua đường dev server) — chưa tới được bước đọc blob. Vì vậy
**không đánh dấu `pay`/`lock` cho chương nào** (đánh dấu mù sẽ sai:
chương 1–87 trước 上架 là miễn phí). Cách xác minh đúng: trong app
thật sau khi qua Cloudflare, mở ch.100 (không nhãn) so với ch.99
(nhãn miễn phí); nếu ch.100 lỗi "không thấy dữ liệu mã hóa" trong khi
ch.99 đọc được thì mới đánh `pay: true` cho chương sau điểm 上架
không có nhãn miễn phí + đổi lỗi chap.js thành "Chương trả phí, cần
mua trên web".

### Health-check / WAF (N2)

Probe health-check đã gửi User-Agent trình duyệt (Chrome 124) và xếp
HTTP 403 thành `BLOCKED` (không tính là hỏng) — phần đề xuất về probe
đã có sẵn trong workflow chung, ext này không sửa thêm. Phần còn lại
ghi trong `health.json` (`note`): WAF từng trả cả 404 cho site này
(issue #2, false positive) nên 404 từ CI cũng chưa kết luận được
hỏng; sức khỏe thật của site chỉ kiểm chứng được bằng trình duyệt/máy
thật. Khi CI bị 403 ở trang chủ thì probe dừng ở `BLOCKED`, không
chạy các case (kể cả case tripwire key).

### Tìm kiếm (search)

GET `/search/?searchkey=<URL-encode>` — đã kiểm chứng: 100 kết quả, không
phân trang, token luôn `""`. Item `li.searchresult`: cover
`img.lazy[data-original]`, tiêu đề `h3` (từ khóa bọc trong
`<span class="hot">`), thể loại/trạng thái `.img_span span`, tác giả `<p>`
đầu, `span.s_gray` số chữ + thời gian, mô tả `p.searchresult_p`, chương
mới nhất `p a[href*=".html"]`.

### Thể loại (genre) — ĐỦ 13 thể loại

ID lấy từ nav trang chủ (kiểm chứng 2026-11-06; **ID 8 không tồn tại** —
`/nosort/8/1/` trả về trang tất cả):

| ID | Thể loại | ID | Thể loại |
|----|----------|----|----------|
| 1 | 玄幻魔法 | 7 | 女生耽美 |
| 2 | 武俠修真 | 9 | 其他類型 |
| 3 | 都市言情 | 10 | 短篇 |
| 4 | 曆史軍事 | **11** | **成人小說** |
| 5 | 科幻靈異 | **12** | **肉文小說** |
| 6 | 遊戲競技 | **13** | **精肉小說** |

**Thể loại người lớn (11 成人, 12 肉文, 13 精肉) được GIỮ LẠI đầy đủ**
trong genre.js, home.js, search.js và book.js — theo **yêu cầu trực tiếp
của người dùng ngày 2026-11-06** (đảo ngược chỉ dẫn loại bỏ ban đầu).
Search/book trả đủ kết quả như site trả, không lọc theo nhãn thể loại;
detail map thể loại người lớn về `/nosort/11|12|13/1/` như các thể loại
khác. Trên trang chủ không có mục riêng cho 3 thể loại này (chỉ có link
ở nav); home.js v2 trỏ 2 trong 3 thể loại đó thành tab riêng (Người lớn,
Nhục văn).

List: `/nosort/<N>/<page>/`, 10 truyện/trang (kiểm chứng p1 vs p2 không
trùng; 玄幻 có tới 7.029 trang). `/quanben/nosort/<N>/1/` = lọc chỉ truyện
đã hoàn thành (đã kiểm chứng).

### Trang chủ (home) — 4 tab (v2, 2026-11-06)

- Mới cập nhật — `/nosort/1/` (book.js)
- Hoàn thành — `/quanben/nosort/1/` (book.js)
- Người lớn — `/nosort/11/1/` (book.js)
- Nhục văn — `/nosort/12/1/` (book.js)

Tab tĩnh, không fetch (v1 dùng 4 tab 大神小说/热门小说/最新小说/最新章节
parse từ trang chủ `/`, nhưng mở app là chạy ngay tab đầu tiên, fetch
trang chủ bị Cloudflare chặn 403 nên trang chủ báo lỗi ngay — extension
của mizhm dùng tab tĩnh trỏ về `/nosort/` thì chạy bình thường trên máy
thật cùng lúc đó). Các mục trang chủ cũ vẫn được `book.js` hỗ trợ qua
input `/home/dashen|remen|zuixin|zuixinzhangjie`, chỉ là `home.js`
không dùng nữa.

Ảnh trang chủ dùng `src` thật; list/search dùng `img.lazy`
(`src` = ảnh nocover placeholder, `data-original` = ảnh thật).

### book.js

List script chung cho: tab trang chủ (`/nosort/...`,
`/quanben/nosort/...` — từ home.js/genre.js), input cũ
`/home/dashen|remen|zuixin|zuixinzhangjie` (parse từ các mục trang chủ,
vẫn hỗ trợ),
trang thể loại `/nosort/<N>/<page>/` (viết lại số trang trong URL,
next token từ link pager lớn nhất), URL đầy đủ, và từ khóa (fallback
về parse kiểu search).

## File đã bỏ khỏi template

- `page.js` — TOC không phân trang (nằm trên trang chi tiết).
- `explore.js`, `similar.js`, `comments.js` — site không có dữ liệu
  tương tự/bình luận; home.js đã đủ tab.
- `cleanHtml.js` (lib) — không cần: nội dung chương sau giải mã đã là
  HTML `<p>` sạch; giữ lại sẽ thành file mồ côi theo AGENTS.md §9.

## Cloudflare — chặn test trên máy thật

Site chạy sau Cloudflare (`Server: cloudflare`). Curl từ VM với UA Chrome
trả HTTP 200 mọi lần (~20 request), không challenge, không cần cookie,
không cần đăng nhập để đọc chương.

**Nhưng IP 5G của điện thoại bị challenge:** mọi request từ máy đều trả
HTTP 403 "Just a moment..." (title tiếng Việt "Chờ một chút...", chứa
`challenges.cloudflare.com`), kể cả UA desktop/mobile. Browser fallback
(WebView trong app) thăm dò title ~35s mà challenge **không tự giải**
(`hasNovelInfo=false`). Vì vậy **chưa script nào cần mạng được test pass
trên máy thật** (xem `~/workspace/vbook/novels-build.md`).

Cách mở khóa duy nhất đã biết: **thử lại khi máy dùng Wi-Fi (IP khác)
hoặc IP 5G đổi**. Lưu ý: `lib/fetch-helpers.js` đã được sửa để nhận diện
cả challenge title tiếng Việt ("Chờ một chút") — trước đó chỉ nhận
"Just a moment", khiến trang challenge bị trả về như tài liệu thật và gây
lỗi parse gây hiểu lầm. Bản sao cũ trong `apptruyenchu` và `hhkungfu`
chưa được cập nhật.

**Phát hiện mới 2026-11-06 (so với extension của mizhm):** extension
Novels TW của mizhm (v3) chạy được **trong app thật** trên cùng máy,
cùng lúc extension này còn lỗi — vì (1) home của nó là tab tĩnh trỏ về
`/nosort/` (không fetch trang chủ `/`), và (2) nó dùng UA mặc định của
runtime, không xoay UA. Cookie `cf_clearance` sau khi người dùng qua
xác minh trong trình duyệt của app được chia sẻ cho extension **trong
app thật**, nhưng KHÔNG chia sẻ cho đường test qua developer server —
nên test qua dev server vẫn 403 dù trong app đã chạy được. Từ đó v2:
`home.js` đổi sang tab tĩnh `/nosort/`, bản sao `src/fetch-helpers.js`
của extension này **bỏ xoay User-Agent** (giữ UA mặc định để cookie còn
hiệu lực). Lưu ý: `browserFetch` của mizhm chỉ nhận title "Just a
moment" nên bị trang challenge tiếng Việt lừa trả về rỗng (detail/toc
code 0 nhưng dữ liệu rỗng khi test qua dev server); bản này nhận cả
"Chờ một chút".

## Trạng thái test (2026-11-06)

- **Pass trên máy thật (v1):** `genre.js` (code 200, đủ 12 thể loại —
  sau khi sửa theo yêu cầu giữ thể loại người lớn), `home.js` (code 200,
  4 tab).
- **Chưa pass qua dev server (Cloudflare 403):** `detail.js`, `toc.js`,
  `chap.js`, `search.js`, `book.js` — lỗi sạch tiếng Việt, không crash.
  Lưu ý: đường test dev server không chia sẻ cookie với trình duyệt
  trong app, nên 403 ở đây không kết luận được trong app thật — extension
  của mizhm chạy được trong app thật cùng máy, cùng lúc (xem mục
  Cloudflare). Cần test v2 trực tiếp trên app.
- **2026-11-09 (v4):** test qua dev server trên máy HONOR PTP-AN10 vẫn
  403: `chap.js` ch.99 (nhãn 免費章節) và ch.100 (không nhãn) lỗi giống
  hệt nhau ở bước fetch (`fetchPage HTTP 403`) — chưa kết luận được
  chương trả phí (N3) hay tình trạng đọc chương trong app thật; cần
  test trong app sau khi qua Cloudflare (xem mục Chương trả phí).
- **Verify ngoài máy:** AES thuần-JS khớp WebCrypto trên cả 5 blob chương
  thật + vector test FIPS-197; selector đối chiếu với HTML đã lưu;
  regexp plugin.json kiểm chứng bằng Python `re`; toàn bộ src qua
  `node --check`, không dùng cú pháp cấm.
