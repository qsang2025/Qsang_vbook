# 七猫免费小说 — qimao.com

Extension nguồn truyện chữ tiếng Trung giản thể cho [七猫免费小说](https://www.qimao.com)
(七猫中文网, Shanghai Qimao Culture Media). Truyện miễn phí chính thống: ngôn tình,
huyền huyễn, đô thị, lịch sử, khoa huyễn, v.v. Đọc nguyên văn tiếng Trung, không dịch máy.

- Tác giả extension: **MuseAi** (bản của Bẹp, nhánh `feature/qimao-muse` — làm song song
với bản Antigravity trên nhánh riêng để so sánh sau).
- Type: `novel`, locale `zh_CN`, version 2.
- Vòng đời đầy đủ: `home` (tab tĩnh) / `genre` / `search` / `detail` / `toc` / `chap`
+ list dùng chung `book.js`. Không có `page.js` (mục lục nằm gọn trong một response API).

## Kiến trúc — API-first (quyết định sau khi test trên máy thật, 2026-11-09)

Bản đầu viết theo hướng scrape HTML đã **thất bại khi test trên máy**: trang qimao là
Nuxt shell — HTML thô gần như không có link thật (trang chi tiết chỉ có **1 anchor**
`javascript:void(0)`), og meta đều chung chung (`七猫中文网`), nội dung chương không
nằm trong DOM text. Bản hiện tại dùng **API chính thức của app 七猫** (đã kiểm chứng
live từ VM **và** trên máy thật):

| Script | Nguồn chính |
|---|---|
| `search.js` | `GET https://api-bc.wtzw.com/search/v1/words` (ký MD5) — `data.books[]`, `data.meta.next_page` |
| `detail.js` | `GET https://api-bc.wtzw.com/api/v1/reader/detail?id=<bookid>` (ký MD5) |
| `toc.js` | `GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list` (ký MD5, `chapter_ver=0`) — sắp xếp theo `chapter_sort` |
| `chap.js` | `GET https://api-ks.wtzw.com/api/v1/chapter/content?id=<bookid>&chapterId=<chapterid>` (ký MD5) → `data.content` giải mã AES-128-CBC; dự phòng `chapterData` DES-ECB trên trang chương (chỉ là bản xem trước ~100 chữ), rồi DOM `.chapter-detail-article` |
| `book.js` | `__NUXT__` state của trang danh sách/bảng xếp hạng (mảng sách ở key `book_list`/`books`/`list`/…), dự phòng parse DOM anchor |

Ký API (logic công khai của `shing-yu/7mao-novel-downloader`, được `talebook#805` và
`shing-yu/swiftcat-downloader-flutter` xác nhận lại, đã kiểm chứng MD5 khớp 100%
Python `hashlib` cả với chữ Hán, trên máy thật):
`sign = MD5_hex(concat các "k=v" đã sắp xếp key + "d3dGiJc651gSQ8w1")`, áp cho cả
params lẫn headers. Headers app: `app-version: "73720"` (cố định — server chấp nhận
mọi version trong danh sách, không cần random), `application-id: "com.****.reader"`,
`channel: "unknown"`, `net-env: "1"`, `platform: "android"`, `qm-params: ""`, `reg: "0"`,
`AUTHORIZATION: ""`. Code ký nằm ở `src/qimao-api.js` (dùng `CryptoJS.MD5` qua
`load('crypto.js')` — file lib có sẵn trong repo).

Nội dung chương (theo hàm `_decrypt` của 7mao-novel-downloader và `decryptChapterContent`
của swiftcat-downloader-flutter — hai bên khớp nhau): **AES-128-CBC, key cố định
`"242ccb8230d709e1"`** (16 byte ASCII; hex `32343263636238323330643730396531`),
**IV = 16 byte đầu của blob base64**, phần còn lại là ciphertext, padding PKCS#7.
Giải mã xong là text thường, **mỗi đoạn một dòng, ngăn cách bằng `\n` đơn** (không phải
`\r\n\r\n` — bản v1 tách sai nên nếu giải mã thành công cũng chỉ ra một `<p>` duy nhất;
v2 tách theo `/\r?\n/`). Code giải mã thuần JS nằm ở `src/qimao-crypto.js` (khối AES
copy từ `novels` chap.js — S-box tự tính từ phép nhân GF(2^8), đã kiểm chứng trên
Rhino — chỉ khác IV: novels dùng IV 0, qimao lấy IV từ đầu blob).

## Kết quả khảo sát site (2026-11-09, kiểm chứng live)

### Chặn IP datacenter + giới hạn tốc độ (HTTP 405) — vấn đề lớn nhất
- VM (IP datacenter): `curl https://www.qimao.com/` → **empty reply / HTTP 000** với mọi
biến thể (HTTP/1.1, TLS 1.2, `-k`, UA desktop/mobile, node fetch) — WAF cắt kết nối.
Chỉ `https://qimao.com/` (không `www`) trả 301, còn lại đều 000.
- Trừ CDN: `cdn-front.qimao.com` vẫn trả 200 từ VM (logo lấy được từ đó).
- **API host (`api-bc.wtzw.com`, `api-ks.wtzw.com`) KHÔNG bị chặn**: search/detail/catalog
chạy được cả từ VM lẫn máy thật — đây là lý do chính để chuyển sang API-first.
- **www.qimao.com giới hạn tốc độ cả IP điện thoại**: sau ~6–10 request nhanh (trong đó
có 2 request song song) thì toàn bộ host bắt đầu trả **HTTP 405** — cả fetch OkHttp
của app lẫn WebView browser đều 405 (title trang browser là `405`). Block kéo dài
**hơn 2 giờ** (bắt đầu tối 2026-11-09, vẫn 405 khi test lại sau đó), **đã hết lúc
~23:46** (probe trả HTTP 200 lại). **Bài học**: đừng test dồn dập trên
www.qimao.com — một request một lần, cách nhau ≥60 giây; nếu thấy 405 thì chờ, đừng
retry liên tục (retry chỉ kéo dài block). Từ v2, `chap.js` dùng API `api-ks` (không
bị chặn) làm nguồn chính nên không còn phụ thuộc www cho nội dung chương; `book.js`
vẫn cần www (đã test lại PASS sau khi 405 hết).

### URL đã xác minh (live 2026-11-09)
| Trang | URL mẫu |
|---|---|
| Trang chủ | `https://www.qimao.com/` (Nuxt shell + JS) |
| Chi tiết sách | `https://www.qimao.com/shuku/{bookid}/` — vd `.../shuku/10090611/` |
| Trang chương | `https://www.qimao.com/shuku/{bookid}-{chapterid}/` — vd `.../shuku/10090611-48385031/` (ch.492) |
| Cổng đọc | `https://www.qimao.com/reader/index/{bookid}/` (shell, không có dữ liệu chương — đã kiểm tra) |
| Danh sách lọc | `https://www.qimao.com/shuku/{7 đoạn}-{sort}-{page}/` — vd `.../shuku/a-a-a-a-a-a-0-update_time-1/` (连载中), `.../shuku/a-a-a-a-a-a-1-click-1/` (已完结) |
| Bảng xếp hạng | `https://www.qimao.com/paihang/{boy\|girl}/{new\|hot\|...}/{date\|month}/` — vd `.../paihang/boy/hot/date/` |
| Tìm kiếm | `https://www.qimao.com/search/index/?keyword=<urlencoded>` (trang web render bằng JS — không dùng; search dùng API) |
| Trang tác giả | `https://www.qimao.com/zuozhe/{tên}_{id}/` |

### Trang chi tiết `/shuku/{id}/` — Nuxt shell, dữ liệu trong `window.__NUXT__`
- HTML thô (85.853 byte): **không có `<h1>`/`<h2>`**, og meta đều chung `七猫中文网`,
chỉ **1 anchor** (`javascript:void(0)`), không có link `/shuku/` nào trong DOM.
- `<title>` có ích: `错婚四十年，重生换嫁冷面军少被宠上天_(商十一)小说最新章节全文免费在线阅读下载-七猫免费小说`.
- `window.__NUXT__` là IIFE: `window.__NUXT__=(function(a,b,c,...){...return {layout:...,data:[{book_detail:{...}, first_fifty_chapter_list:[...]}]}})(ARGS)` — biến 1 chữ
được giải bằng danh sách tham số cuối (mỗi trang có danh sách riêng).
- `book_detail`: `book_id`, `words_num:{number:1179655,value:"118.0",title:"字"}`,
`image_link` (bìa), `author:"商十一"`, `title`, `category_1_name:"现代言情"`,
`category_2_name:"年代重生"`, `score:{value:"9.3",title:"分"}`, `pursue_count`,
`hot_value`, `characters:["徐晓兰","江洵"]`, `is_over`, `intro` (chứa `\u003Cbr\u003E`).
- `first_fifty_chapter_list`: 50 chương đầu `{id, title, is_vip, update_time, words,
index, chapter_sort}` — chỉ 50 chương đầu, không đủ làm mục lục.
- Trang chi tiết còn nhúng sẵn text chương 1 trong state (thử đọc) — detail.js không
dùng phần đó.

### Mục lục — API catalog, đủ chương (đã kiểm chứng)
- `GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list` trả **đủ** chương:
10090611 → **510 chương** (đầu 第1章 为了小慧的名声，我愿意负责 id 41836422,
cuối 第510章 双胞胎该喊小舅还是弟弟（完结篇） id 48554501);
2055374 → **475 chương** (đầu 第1章 穿书了～, cuối 第475章 全文完).
- `toc.js` chỉ dùng **id + title thật** từ API, sắp xếp theo `chapter_sort`, link
chương `/shuku/<bookid>-<chapterid>/` — không tự tính số chương, không tự sinh link.
- Catalog API không có cờ `is_vip` — `toc.js` để `lock/pay = false` (nội dung chương
vẫn đọc được qua `chapterData` giải mã); nếu sau này API thêm `is_vip` thì gắn cờ ở đây.

### Nội dung chương — API chapter/content (v2) + `chapterData` chỉ là bản xem trước DES
- **Nguồn chính (v2): `GET https://api-ks.wtzw.com/api/v1/chapter/content`** (host
`api-ks`, không bị chặn). Tham số ký MD5: `{id: <bookid>, chapterId: <chapterid>}`
— **chú ý `chapterId` camelCase**: dùng `chapter_id` snake_case thì server trả
`{"errors": {... "title": "参数错误"}}` (tham số sai). Trả về
`data: {content, content_md5, id, type}`; `data.content` là blob base64 AES
(giống hệt file `.txt` trong ZIP tải nguyên cuốn — cùng độ dài từng byte, cùng
key/IV) — giải mã bằng `qimaoDecryptChapter()` ra toàn chương. Đã kiểm chứng
thật 2026-11-09: ch.492 (10090611-48385031) `data.content` dài 9.964 ký tự,
giải ra **2.552 chữ (2.077 chữ Hán)**, khớp file ZIP; ch.1 (10090611-41836422)
giải ra 2.267 chữ, khớp ZIP; ch.1 của 2055374 (17556698360001) giải ra 2.899
chữ, 2.459 chữ Hán, khớp 117 đoạn trên máy thật. **Kể cả chương có
`chapterInfo.is_vip:"1"` (ch.492) API vẫn trả đủ nội dung** — ít nhất với 2
truyện mẫu này, không có khóa nội dung qua API.
- **Giả thuyết v1 SAI (đã bác bỏ 2026-11-09): `chapterData` trên trang chương
KHÔNG phải toàn chương mã hóa AES.** Trang chương `.../10090611-48385031/`
(24.779 byte): body text chỉ **412 ký tự** (nav + lời nhắc tải App), không có
nội dung chương trong DOM text. `chapterData` xuất hiện **đúng 1 lần**, dài
**760 ký tự** (~570 byte) — quá nhỏ cho chương ~2.450 chữ; trang không chứa
blob dài nào khác (chỉ `intro` 393 ký tự + `chapterData` 760). Giải mã AES
trả rỗng (570 byte % 16 = 10, decryptor từ chối). **Định dạng thật** (theo bài
CSDN "七猫小说 chapterdata解密", đã kiểm chứng offline bằng Node crypto +
trên máy thật bằng `CryptoJS.DES` trong Rhino): `chapterData` =
`base64(base64(ciphertext-DES))` (728 ký tự đầu) + **key 32 ký tự cuối**;
khóa DES = **8 byte đầu của chuỗi hex MD5(key) dạng ASCII**; **DES-ECB,
PKCS#7**; giải ra HTML có tag `<p>`, **~100 chữ** — chỉ là **bản xem trước**
(mở đầu chương, kết đúng chỗ chương tiếp tục). Code ở `src/qimao-des.js`
(dùng `CryptoJS.DES` có sẵn trong `lib/crypto.js`).
- `chap.js` v2: API content trước → nếu API hỏng thì lấy preview DES trên
trang web (trả kèm ghi chú rõ "[Bản xem trước — mở App 七猫免费小说 để đọc
đầy đủ chương này]") → cuối cùng mới DOM. Preview **không** áp dụng ngưỡng
200 chữ / 20% `本章字数` (vì đã ghi chú rõ là xem trước).
- `Engine.newBrowser()` (WebView) cũng không render được nội dung (`.chapter-detail-article`
dài 0, `[class*="chapter-detail"]` chỉ 405 ký tự header/info) — nội dung không render
ngay cả trong trình duyệt của app trong thời gian probe chờ.
- Tên chương **không** trả qua `data2` (tên trong `<title>` dính kèm tên tác giả, không
tách được sạch) — app dùng tên chương từ mục lục (API catalog), vốn là tên thật.

### Chương khóa / VIP — cơ chế của qimao
- Mọi trang chương đều hiện lời nhắc chung: `下载，继续在APP内免费畅读全本内容`
và `在APP端开通会员，继续在电脑端无广告免费畅读。（单本书会员暂不支持）` + `我已是会员，立即登录`.
- Đó là **lời nhắc chung, không phải khóa từng chương** — qimao quảng cáo "miễn phí":
đọc tiếp thì tải App (miễn phí trong App), hoặc mở 会员 để đọc web không quảng cáo.
- `chapterInfo.is_vip` tồn tại (ch.492 có `is_vip:"1"`) nhưng **ngữ nghĩa chưa xác minh**
(không rõ "1" là khóa đọc hay chỉ là chương VIP trong App) — đừng suy đoán. Thực tế
kiểm chứng 2026-11-09: **API chapter/content vẫn trả đủ nội dung ch.492** (2.552 chữ)
dù `is_vip:"1"` — ít nhất với truyện mẫu này, `is_vip` không khóa nội dung qua API.
Nếu sau này gặp chương API trả rỗng/lỗi thì `chap.js` sẽ rơi về preview DES + DOM.
- `chap.js` chỉ báo lỗi khóa khi **không có/đủ nội dung** (giải mã rỗng + DOM rỗng/<200
ký tự) kèm lời nhắc App/会员, hoặc khi nội dung đọc được < 20% số chữ công bố (`本章字数`)
— kèm hướng dẫn mở App 七猫 / đăng nhập 会员. Không gắn cờ `lock/pay` bừa cho mọi chương.
- Không có đăng nhập trong extension: qimao không cho đăng nhập bằng tài khoản web
trong extension, và không commit token/cookie (quy tắc repo).

### Tìm kiếm — API, fuzzy
- Search API trả kết quả **fuzzy**: tìm `错婚四十年` ra 11 kết quả, truyện đúng đứng
thứ 3 — extension trả đúng thứ tự API trả về, không tự lọc (giống ixdzs8).
- `title` có thể lẫn tag highlight `<font color='#ff4242'>` — `search.js` strip tag
trước khi hiển thị, dùng `original_title`/`original_author` (sạch) khi có.
- Phân trang: `data.meta.next_page` (`"2"`, …; hết thì rỗng) — token trang kế là số trang
dạng chuỗi.

### Danh sách /shuku/ — 7 đoạn lọc chưa giải mã hết
- Ví dụ: `a-a-a-a-a-a-0-update_time-1` (连载中), `a-a-a-a-a-a-1-click-1` (已完结),
`1-a-a-a-2-a-0-update_time-1` (7天内更新·连载中),
`a-4-21-1-2-a-a-click-1` (玄幻仙侠·7天内更新·30万以下),
`a-1-278-4-3-a-1-update_time-1` (年代重生·30天内更新·100-200万字·已完结).
- Suy đoán (chưa chắc): đoạn 7 = trạng thái (0 连载中 / 1 已完结 / a tất cả).
Các đoạn còn lại chưa giải mã — nên `genre.js`/`home.js` **chỉ dùng URL đã kiểm chứng
live**, không tự suy URL lọc mới. Muốn mở rộng cây thể loại thì cần mở `/shuku/` trên
trình duyệt thật và đọc các link lọc.
- Parser danh sách **không dựa vào link DOM** (vì SSR gần như không có link thật):
`book.js` parse mảng sách trong `__NUXT__` state (thử các key `book_list`/`books`/
`list`/`data_list`/… — lấy mảng đầu tiên có ≥1 object đủ `id` số + `title`), dự phòng
mới parse anchor DOM. **Chưa kiểm chứng được** (www đang 405) — key mảng thật của
trang danh sách/bảng xếp hạng vẫn là ẩn số; khi 405 hết, chạy probe đọc key state rồi
thu hẹp `extractNuxtBooks` theo key thật.

### Mirror
- Chưa có mirror nào được kiểm chứng. Ứng viên: `wtzw.com` (梧桐中文网 — tiền thân của
qimao, CDN bìa vẫn dùng `cdn.wtzw.com`) nhưng chưa xác minh `www.wtzw.com` có phục vụ
cùng đường dẫn hay không → `MIRROR_LIST` mặc định rỗng, người dùng tự thêm khi có
mirror xác thực. Lưu ý: mirror chỉ giúp `book.js`/`chap.js` (đường www) — API host
`api-bc`/`api-ks` hiện vẫn mở, không cần mirror.

## Ý tưởng sáng tạo (đã áp dụng / đề xuất)

Đã áp dụng trong bản này:
1. **Pivot sang API app có ký thay vì scrape HTML** (ý tưởng 5 cũ, nay là kiến trúc chính):
khi DOM gần như trống, API app là đường sống duy nhất cho search/detail/toc — và nó
chạy được cả từ VM (không bị WAF) lẫn máy thật. MD5 ký đã kiểm chứng khớp Python 100%.
2. **Giải mã nội dung chương AES-128-CBC thuần JS trong Rhino** (key cố định + IV từ đầu
blob, code AES tự tính S-box, copy pattern từ `novels` chap.js): đọc được nội dung mà
không cần trình duyệt/JS render, không cần đăng nhập.
3. **Báo lỗi khóa thay vì trả rỗng**: `chap.js` phân biệt "lời nhắc App chung" với
"chương thật sự không đọc được", đối chiếu độ dài nội dung với `本章字数` công bố
để phát hiện chặn hiển thị — người dùng biết rõ vì sao không đọc được và phải làm gì
(mở App / đăng nhập 会员), thay vì thấy chương trắng.
4. **Parser danh sách từ `__NUXT__` state thay vì DOM**: khi SSR không có link thật thì
state JSON là nguồn duy nhất cho danh sách — quét mảng sách theo key, không phụ thuộc
class DOM (đổi class là kiểu đổi giao diện thường gặp nhất).
5. **Tìm kiếm trả đúng thứ tự fuzzy của API** (không tự lọc) + strip tag highlight
`<font>` — giữ hành vi giống ixdzs8.

Đề xuất, chưa làm (cần kiểm chứng / quyết định của Anh):
6. **Tìm nguồn gốc thay chương khóa** (ý Antigravity đã làm cho tiemtruyenchu_vip):
nếu một chương qimao bị khóa web, có thể dùng tên sách + tác giả để tìm bản gốc
trên nguồn Trung khác trong repo (ixdzs8...) rồi đọc chương đó ở nguồn kia.
Đây là tính năng liên-nguồn, vượt phạm vi một extension — đề xuất làm ở tầng app
hoặc một script `action` riêng, không nhét vào `chap.js`.
7. **Dùng cổng đọc `/reader/index/{bookid}/`** làm nguồn dự phòng cho `chap.js`:
đã kiểm tra — cũng là shell, không có `chapterData`/`chapter_list` nên **không dùng
được** (ghi lại để khỏi thử lại).
8. **Giải mã cây lọc `/shuku/` đầy đủ** (7 đoạn) để `genre.js` có cây thể loại thật
thay vì 5 bộ lọc curated như hiện tại — cần mở trang lọc trên trình duyệt thật.
9. **Kiểm tra font-obfuscation**: nếu `chap.js` trả text garbled, cần xác định cơ chế
(custom webfont đổi glyph) — hướng xử lý có thể là tải font + đọc cmap, nhưng nặng
và chưa chắc làm được trong runtime Rhino; ghi nhận là rủi ro mở, không đoán mò.
10. **Endpoint tải nguyên cuốn ZIP** (`GET https://api-bc.wtzw.com/api/v1/book/download`,
params ký `{id, source:1, type:2, is_vip:1}` → `data.link`): trả ZIP chứa toàn bộ chương
đã mã hóa (mỗi file một chương, giải mã bằng cùng AES key/IV) — dùng được cho tính
năng **tải nguyên cuốn / đọc offline** ở tầng app, nhưng **không dùng cho `chap.js`**:
mỗi lần mở một chương mà tải cả cuốn (MB) + giải nén ZIP trong Rhino (không có hỗ trợ
ZIP) là không khả thi. Ghi lại để khỏi mất công tìm lại.
11. **Endpoint detail v4** (`GET https://api-bc.wtzw.com/api/v4/book/detail`, params
`{id, imei_ip, teeny_mode:"0"}` — theo swiftcat): bản detail mới hơn v1 đang dùng;
v1 đã đủ dữ liệu nên chưa đổi — chỉ ghi lại nếu v1 bị bỏ.
12. ~~**Khi 405 hết**: chạy lại `book.js` + `chap.js` trên máy (một request một lần,
cách nhau đủ lâu), đọc key mảng thật của `__NUXT__` trang danh sách để thu hẹp
`extractNuxtBooks`, và kiểm chứng giải mã `chapterData` thật (độ dài ~2450 chữ cho
ch.492, tiêu đề khớp 第492章 让他们一直陪着孙子).~~ — **XONG 2026-11-09 ~23:46–00:15**:
405 hết, `book.js` test lại PASS; `chap.js` v2 viết lại theo API chapter/content,
test trên máy PASS cả 2 chương (ch.492: 2.077 chữ Hán, 102 đoạn; ch.1 của 2055374:
2.459 chữ Hán, 117 đoạn — khớp ground truth API/ZIP từng byte). `chapterData`
được xác định chỉ là preview DES ~100 chữ (xem mục "Nội dung chương" trên).
Key mảng thật của `__NUXT__` trang danh sách vẫn chưa thu hẹp (book.js PASS bằng
quét key hiện tại — ghi lại nếu sau này cần tối ưu).

## Test
- Fixture: `test.json` (2 truyện thật: 10090611 — 510 chương; 2055374 — 475 chương,
đã 完结; chương 492 id 48385031, 2450 chữ).
- Health: `health.json` (trang chủ, chi tiết, danh sách, bảng xếp hạng, tìm kiếm).
- Icon: logo thật của qimao (`cdn-front.qimao.com/.../logo.d026f02.png`, resize 200×200).
- `validate`: **PASS, 18 nguồn, 0 cảnh báo** (2026-11-09). Zip 58.014 byte (crypto.js inline).
- Kết quả test trên máy thật (HONOR PTP-AN10, 2026-11-09 tối) — xem chi tiết ở
`~/workspace/vbook/work/ext-review/QIMAO-MUSE-PROGRESS.md`:
  - install: code=200 ✓ (cả v1 và v2)
  - search.js `错婚四十年`: PASS — 10 kết quả, truyện đúng (10090611) có mặt, next token `"2"` ✓
  - detail.js ×2: PASS — đủ tên/tác giả/mô tả/trạng thái/chương mới nhất ✓
  - toc.js ×2: PASS — 510 + 475 chương, chương đầu/cuối khớp fixture ✓
  - home.js: PASS (7 tab tĩnh) ✓ · genre.js: PASS (5 tab lọc) ✓
  - book.js: PASS (test lại 23:46 sau khi 405 hết — danh sách thật từ `__NUXT__`) ✓
  - chap.js v2: **PASS** — ch.492 (10090611-48385031): 2.077 chữ Hán, 102 đoạn
    `<p>`, mở đầu "赵秘书身后跟着两个人。" kết "你们是谁？", khớp ground truth
    API/ZIP từng byte ✓ · ch.1 của 2055374 (17556698360001): 2.459 chữ Hán,
    117 đoạn, khớp API ✓ · DES preview: PASS trên máy thật bằng probe tạm
    (`CryptoJS.DES` trong Rhino giải đúng blob 760 ký tự → 167 ký tự HTML,
    mở đầu chương) ✓ · search smoke test sau khi cài v2: PASS (code=200) ✓
  - Không gặp lại HTTP 405 trong toàn bộ test v2 (chap.js dùng API host,
    không chạm www trừ fallback).
