# Truyện Full (truyenfull.link)

Extension truyện chữ tiếng Việt cho vBook — chuyên **Tiên Hiệp, Đô Thị, Võng Du**,
đọc **miễn phí, không khóa chương VIP**.

- **Site:** https://truyenfull.link (WordPress, theme tv6)
- **Loại:** novel — **Locale:** vi_VN — **Tác giả:** Qsang — **Phiên bản:** 1
- **Ngày khảo sát / xây dựng:** 2026-11-06

## Vì sao chọn nguồn này

Khảo sát live bằng curl từ VM ngày 2026-11-06 (xem chi tiết dưới):

| Tiêu chí | Kết quả |
|---|---|
| Thể loại Tiên Hiệp / Đô Thị / Võng Du | Có đủ: Tiên Hiệp 25 trang, Đô Thị 229 trang, Võng Du 5 trang (30 truyện/trang); menu trang chủ có 46 thể loại |
| Chương miễn phí, không khóa VIP | Không có từ VIP / trả phí / mua chương / khóa chương trên trang chi tiết, trang chương, trang thể loại, trang tìm kiếm. Chương 1 và chương mới nhất đọc được trực tiếp, không cần đăng nhập |
| Truy cập được từ VM | HTTP 200 mọi trang (trang chủ, thể loại, chi tiết, chương, tìm kiếm, admin-ajax). Không bị Cloudflare chặn |
| Nội dung chương trong HTML SSR | Có — `#chapter-c`, không mã hóa JS |
| Tìm kiếm hoạt động | Có — `/?s=<từ khóa>&post_type=tv6_story`, truyện cần tìm lên đầu |

## Bằng chứng miễn phí / không VIP (đã kiểm chứng)

- Truyện mẫu **Cực Đạo Thiên Ma** (Tiên Hiệp, tác giả Cổn Khai):
  `https://truyenfull.link/truyen/cuc-dao-thien-ma/`
  - Trang chi tiết HTTP 200, không có chữ VIP / trả phí / mua chương / Nạp xu
    (từ "khóa" duy nhất trên trang là trong "Từ khóa tìm kiếm" — ô tìm kiếm).
  - Chương 1 `https://truyenfull.link/chuong/cuc-dao-thien-ma-chuong-1/`:
    nội dung đầy đủ 126 dòng trong `#chapter-c`, không cần đăng nhập.
  - Chương mới nhất (chương 48) đọc được như chương 1.
- Truyện mẫu **Đạo Kiếm Thần Hoàng** (1.594 chương):
  `https://truyenfull.link/truyen/dao-kiem-than-hoang/`
  - Mục lục lấy đủ 1.594 chương qua AJAX, không chương nào có cờ khóa/trả phí.
- Trang "Nội quy sử dụng" của cùng thương hiệu (truyenfull.lat) ghi rõ:
  "Web miễn phí 100%, không thu phí, không gói VIP."

Lưu ý: site còn mới (ra mắt khoảng tháng 10/2026) nên kho truyện đang nhập dần —
một số bộ dài hiện chỉ có các chương đầu (Cực Đạo Thiên Ma: 48 chương trên site,
thực tế bộ này dài hơn nhiều). Đây là **thiếu nội dung, không phải khóa VIP**:
không có thông báo khóa, không yêu cầu đăng nhập hay trả phí ở chương cuối.

## Ứng viên bị loại

| Ứng viên | Lý do loại |
|---|---|
| metruyenchu.com | **Đã đóng cửa từ 10/02/2026** (trang chủ chỉ còn thông báo "Tạm biệt!") |
| truyencv.com | Cùng thông báo đóng cửa (cùng hệ thống với metruyenchu) |
| metruyencv.com | HTTP 403; metruyenchu.net chết (000) |
| truyenyy.com / truyenyy.xyz | Chết (000) |
| truyenfull.vn / .vision / .today | HTTP 521 (origin sập); truyenfull.io / .net chết; truyenfull.bio 521 |
| truyenfull.live | HTTP 403 — Cloudflare chặn IP datacenter của VM (giữ làm mirror dự phòng trong config; trên điện thoại có thể qua được) |
| truyenfull.lat | Không có thể loại Tiên Hiệp / Võng Du; SvelteKit SPA (nội dung qua JS, không SSR) |
| truyencv.io | Không có hệ thống thể loại (không có /the-loai, /category, /tag); link chi tiết trên trang chủ trả 404; có dấu hiệu kinh tế xu/VIP ("Kiếm Xu", "Vòng quay may mắn", có chữ VIP trên trang) |

## Cấu trúc site (để bảo trì)

- Trang chi tiết: `https://truyenfull.link/truyen/<slug>/`
  - Tên: `h1`; ảnh bìa: `img[itemprop="image"]`; tác giả: `.info a[itemprop="author"]`
  - Thể loại: `.info a[itemprop="genre"]` → `/the-loai/<slug>/`
  - Trạng thái: nhãn "Trạng thái:" trong `.info` — giá trị `"Full"` = hoàn thành,
    `"Đang cập nhật"` = đang ra (khác các site khác, đừng dùng `indexOf("Hoàn")`).
  - Mô tả: `.desc-text[itemprop="description"]`; đoạn `<p>` đầu nếu là metadata
    `<b>Thể loại: </b>...<br><b>Editor: </b>...` thì bỏ.
  - Trang chi tiết chỉ render SSR **50 chương đầu** trong `#list-chapter`.
- Mục lục đầy đủ: WordPress admin-ajax (xem `toc.js`):
  `GET /wp-admin/admin-ajax.php?action=tv6_client&nonce=<nonce>&task=chapters&id=<storyId>`
  → `{"success":true,"data":{"items":[{"id","name","url"}]}}`.
  `storyId` lấy từ `comment_post_ID` trong HTML trang chi tiết; `nonce` lấy từ
  biến `tv6` (`"nonce":"..."`). Nonce **bắt buộc** (sai/thiếu → server trả `-1`)
  và hết hạn theo phiên WordPress — toc.js tải lại trang chi tiết để lấy nonce
  mới mỗi lần, không hardcode. Fallback: link chương SSR trong `#list-chapter`.
- Trang chương: `https://truyenfull.link/chuong/<slug>-chuong-<số>/`
  - Nội dung: `#chapter-c` (các `<p>`); cuối khối có dòng quảng cáo
    `<p class="tv6-read-at">Đọc truyện full tại ...</p>` — đã lọc trong `chap.js`.
  - Tiêu đề: `<h1>` ("Chương N: ...").
- Trang danh sách: `.list-truyen .row[itemtype="https://schema.org/Book"]`
  (20 truyện/trang ở `/danh-sach/`, 30 ở `/the-loai/`), phân trang `/page/N/`.
  - `/danh-sach/truyen-moi/`, `/danh-sach/truyen-hot/`, `/danh-sach/truyen-moi-dang/`,
    `/danh-sach/truyen-full/`, `/danh-sach/tien-hiep-hay/`, `/danh-sach/kiem-hiep-hay/`
- Tìm kiếm: `/?s=<từ khóa>&post_type=tv6_story`, phân trang `/page/N/?s=...`.
- Thể loại: **không có trang `/the-loai/` riêng (404)** — `genre.js` đọc 46 link
  thể loại từ menu trang chủ.
- Icon: favicon thật của site
  (`/wp-content/uploads/2026/10/favicon-300x300.png`), resize 200×200.

## Maintenance watch

1. **Domain hay đổi:** họ "Truyện Full" có nhiều domain (.live, .vn, .vision,
   .today, .lat, .link...). Nếu `truyenfull.link` chết, thử `truyenfull.live`
   (đã có trong config làm mirror) rồi cập nhật `BASE_URL` + `metadata.source`.
2. **Nonce AJAX:** nếu toc.js chỉ trả 50 chương (fallback DOM) thì kiểm tra xem
   site có đổi tên task `chapters`, tham số `action=tv6_client` hay cấu trúc
   biến `tv6` không.
3. **Kho truyện đang nhập dần:** số chương của một bộ có thể tăng theo thời gian
   — đó là bình thường, không phải lỗi.
4. **Cloudflare:** hiện site không chặn VM; nếu sau này bị 403 thì test trên máy
   thật mới là kết quả cuối (dev-server test có thể 403 theo, app thật đã qua
   challenge trong trình duyệt của app thì chạy được — xem bài học novels.com.tw).
