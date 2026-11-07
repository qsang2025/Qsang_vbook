# NiACG — extension gallery ảnh ACG (comic)

- **Nguồn:** https://www.niacg.com/ (thương hiệu **Xpicvid**, tiền thân 逆次元 / 逆ACG)
- **Mirror:** https://www.xpicvid.com/ (cùng site, cùng nội dung)
- **Loại:** `comic` (gallery ảnh) · **Locale:** `zh_CN` · **Version:** 2
- **Nội dung:** COS, CG, 本子 (doujinshi), 套图 (bộ ảnh), 日漫, 韩漫, 最新, 画廊, 漫画
- **⚠️ Nội dung 18+ (NSFW):** toàn site là nội dung người lớn (doujinshi H, manga H, COS gợi cảm). Manifest gắn `nsfw: true` và registry gốc giữ cờ này (quyết định của Anh 2026-11-07: giữ trong catalog chung, có cờ nsfw).

## Phạm vi — chỉ ảnh, không video

Site có cả ảnh và video, nhưng một extension vBook chỉ có một type.
Extension này làm **phần ảnh** (nội dung chính của site: riêng 本子 ~1.800 trang
≈ 108.000 item). Phần **video** (里番 class 19, 3D class 20, 同人 class 21,
视频列表 class 23 — DPlayer, mp4 trực tiếp 1080p/720p trên `file.xunge.cyou`)
**không** thuộc phạm vi extension này; nếu cần thì làm thêm một extension
video riêng (ví dụ `niacg-video`). Item video bị lọc khỏi kết quả tìm kiếm.

## Cấu trúc site (EmpireCMS, SSR hoàn toàn, không có JSON API)

| Loại | URL mẫu |
|---|---|
| Trang chủ | `https://www.niacg.com/` |
| Danh sách | `/listinfo-<classid>-<page>.html` (page từ 0, 60 item/trang) |
| Tag | `/tags-<từ khóa>-<page>.html` |
| Chi tiết gallery | `/moehome-<classid>-<id>.html` |
| Chi tiết info / series | `/showinfo-<classid>-<id>-0.html` (chỉ `-0` hợp lệ) |
| Đọc full gallery | `/moeupup-<classid>-<id>.html` (toàn bộ ảnh trên 1 trang) |
| Đọc chương manga | `/showinfo-16-<readId>-0.html` — tới được từ nút "开始阅读" (Bắt đầu đọc) trên trang `moehome-14/15` của chương; toàn bộ ảnh chương trên 1 trang, nút "下一页" trỏ tới chương kế (không phải trang 2) |
| Tìm kiếm | `/e/search/?searchget=1&keyboard=<kw>&show=title` → 302 tới `/e/search/result/?searchid=<id>`, phân trang `/e/search/result/index.php?page=<N>&searchid=<id>` |

**Classid phải khớp id** (`moehome-3-162877` lỗi "此信息不存在", đúng là
`moehome-1-162877`); luôn lấy classid từ URL danh sách, không tự đoán.

## Vòng đời

- **home.js** — tab tĩnh (rule 9), trỏ về `book.js` với `/listinfo-<class>-0.html`.
- **genre.js** — danh sách mục tĩnh (classid cố định của site).
- **book.js** — một trang danh sách (`.list-col`): link `a[href]`, tên
  `span.video-title` / `title`, bìa `img[data-src]` (bắt buộc dùng `data-src`
  vì `src` chỉ là ảnh placeholder `imgloading*.gif`), nhãn mục `.label-sub`.
  Phân trang: app trang N = site trang N−1.
- **search.js** — tìm kiếm mặc định (không classid) trả về item gallery
  (link `moehome`); lọc bỏ item video (showinfo-19/20/21/23). Phân trang
  2 bước qua `searchid` (lấy từ link phân trang trên trang kết quả, giữ
  trong token `SID:<searchid>|<trang>`). Không có kết quả → trả danh sách
  rỗng (không báo lỗi). Query là đường dẫn (`/listinfo/...`, `/tags/...`)
  thì duyệt thẳng như tab danh sách.
- **detail.js** — `moehome`: tên `h1.book-name`, ngày `上架日期`, tag từ meta
  keywords + link `/tags-`, bìa là ảnh nội dung đầu tiên, mô tả từ
  `#intro-block` (div 敘述; fallback về meta description nếu trống).
  `showinfo` (series 14/15 hoặc trang info): tên từ `<title>`,
  bìa series từ ảnh `comic.xunge.cyou` đầu tiên trên trang. Trạng thái
  ongoing phát hiện thật bằng cách quét 完结/完結/最终话 (đã xong) và
  连载/連載 (đang ra) trên trang; mặc định false khi không thấy dấu hiệu.
- **toc.js** — Series manga (showinfo-14/15): danh sách chương **thật** trong
  `<div class="episode">` — mỗi chương là link `/showinfo-16-<readId>-0.html`
  (trang đọc trực tiếp), tên thật trong `<li class="current_series">`
  (vd 第1话). Xóa `<span class="hidden-xs">` chứa timestamp trước khi lấy
  tên, nếu không tên dính kèm số. Trang liệt kê mới nhất trước nên đảo
  ngược để chương cũ nhất lên đầu. Mỗi chương trỏ thẳng về trang đọc
  showinfo-16 (chap.js đọc ảnh từ đó). Gallery đơn: 1 chương "Đọc toàn bộ"
  trỏ về `/moeupup-<class>-<id>.html`. Không có phân trang mục lục. Chương
  manga mở trực tiếp (moehome-14/15): 1 chương "Chương 1" trỏ về chính
  trang đó (chap.js tìm nút "开始阅读" để sang trang đọc).
- **chap.js** — trả về mảng URL ảnh theo thứ tự.
  - Gallery: đọc trang `moeupup`, ảnh trong `<img class="comic_img"
    data-src="...">` (118 ảnh cho gallery mẫu Tiny Asa).
  - Chương manga: nhận URL `moehome-14/15`, tìm nút "开始阅读"
    (`<a class="reading">`) trên trang đó → trang đọc
    `/showinfo-16-<readId>-0.html`, ảnh chương trong
    `<img class="comic_img" data-src="...">` (20 ảnh cho chương mẫu 101,
    qua showinfo-16-3935). Nếu không thấy nút đọc thì báo lỗi rõ ràng.
  - Gallery: `boom.xunge.cyou/hen/...webp`; manga: `comic.xunge.cyou/m1morepic/...jpg`.
  - Lọc quảng cáo / ảnh giao diện / placeholder / ảnh bìa danh sách
    (`/slthh/` — thumbnail của item khác); khử trùng theo URL. Ưu tiên
    `img.comic_img`, nếu không có thì fallback sang toàn bộ ảnh nội dung.
  - Ảnh bìa/danh sách và ảnh chương dùng `absImageUrl()` (giữ nguyên host
    CDN) thay vì `absUrl()` — `absUrl()` viết lại host về niacg.com sẽ
    làm ảnh CDN 404 (đã gặp và sửa 2026-11-07).
  - Nếu nhận URL `moehome` của gallery thì tự đổi sang `moeupup` tương ứng.

## Header bắt buộc (đã kiểm chứng bằng curl 2026-11-07)

- **Cloudflare chặn request không có User-Agent trình duyệt** (curl mặc
  định → 403 "Just a moment..."). Extension dùng UA mặc định của runtime
  (quy tắc 10: không xoay UA để cookie `cf_clearance` còn hiệu lực); nếu
  fetch thường thất bại, `fetch-helpers.js` tự fallback sang
  `Engine.newBrowser()`.
- **CDN ảnh/video `*.xunge.cyou` bắt buộc `Referer: https://www.niacg.com/`**
  (thiếu → 403). App tự gửi Referer = URL trang chi tiết / chương (cùng
  domain niacg.com) khi tải ảnh bìa và ảnh chương nên đủ điều kiện.

## Lưu ý bảo trì

- Site đổi giao diện EmpireCMS thì kiểm tra lại selector `.list-col`,
  `h1.book-name`, `img[itemprop="image"]`, khối DPlayer (video, ngoài
  phạm vi) và tham số tìm kiếm `/e/search/`.
- `searchid` do server cấp khi tìm kiếm; nếu trang kết quả trả về lỗi hoặc
  hết hạn thì `search.js` sẽ tìm lại từ đầu (token `SID:` hết hiệu lực).
- Tên chương manga series lấy từ `<li class="current_series">` trong
  `<div class="episode">` (tên thật, vd 第1话); nhớ xóa `<span
  class="hidden-xs">` chứa timestamp trước khi lấy tên. Nút "开始阅读"
  trên trang series cũng trỏ về tập đầu (showinfo-16-5692 cho series
  mẫu) nhưng nằm ngoài khối `.episode`, không dùng làm danh sách chương.
- Trang đọc chương manga là `showinfo-16-<readId>-0.html`, `readId` chỉ lấy
  được từ nút "开始阅读" trên trang moehome của chương (không suy ra từ
  chapterId); nếu site đổi class của nút đó thì `chap.js` sẽ báo lỗi và
  cần cập nhật selector `a.reading` / `a[href^="/showinfo-16-"]`.
- Trang `moeupup-14/15` của chương manga KHÔNG chứa ảnh chương (chỉ có
  thumbnail liên quan + 1 `img.comic_img` rỗng) — đừng dùng moeupup cho
  manga; luôn đi qua moehome → nút đọc (hoặc showinfo-16 trực tiếp từ
  mục lục).
- Ảnh bìa trong danh sách dùng `data-src`; nếu site bỏ lazy-load thì
  `coverOf()` trong `helper.js` sẽ tự fallback sang `src`.
- Mirror `xpicvid.com` có thể đổi nội dung/đổi chủ; `fetchDocWithFallback()`
  trong `helper.js` thử domain chính trước rồi mới thử mirror (qua
  `fetchWithFallback()` trong `fetch-helpers.js`); kiểm tra lại khi
  chuyển sang mirror.

## Lịch sử phiên bản

- **v2 (2026-11-07):** sửa lỗi toc series (lấy chương thật từ
  `<div class="episode">` → showinfo-16, tên thật, đảo thứ tự cũ→mới;
  v1 đọc nhầm carousel tác phẩm liên quan và đặt tên giả "Chương N").
  Gộp điểm hay từ bản Antigravity: thêm 15 tag nóng vào genre (trừ
  2 mục video), phát hiện trạng thái ongoing thật trong detail
  (quét 完结/连载), mô tả từ `#intro-block`. Nối `fetchWithFallback()`
  vào các lời gọi fetch để mirror xpicvid.com thực sự hoạt động. Ghi
  tường minh `#referrerpolicy=origin` vào URL ảnh chương. Xóa file
  `cleanHtml.js` mồ côi. Nới regexp trong manifest để khớp cả trang đọc
  moeupup, trang đọc showinfo-16 và mirror xpicvid.com.
- **v1 (2026-11-07):** bản đầu tiên (xem git log).

## Kiểm thử

- `node scripts/cli.js validate` (linter Rhino ES6 + catalog ≡ đĩa)
- `node scripts/cli.js build extensions/comic/niacg` (zip offline)
- Trên máy thật qua dev server: `node scripts/cli.js testall extensions/comic/niacg`
  (xem `test.json` — gallery mẫu Tiny Asa 118 ảnh, series mẫu 日漫 11 chương
  第1话–第11话 → showinfo-16-5692..5702).
