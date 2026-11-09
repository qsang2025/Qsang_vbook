# Extension Sáng Tác Việt (vBook)

Extension đọc và nhúng truyện dịch máy / convert từ **Sáng Tác Việt** (`https://sangtacviet.app`, `https://sangtacviet.vip`, `https://sangtacviet.com`, `https://sangtacviet.pro`).

## Tính năng
- Đọc truyện chữ convert trực tiếp từ nguồn Trung Quốc.
- Hỗ trợ sắp xếp: Mới cập nhật, Lượt đọc tổng, Lượt đọc tuần, Đề cử...
- Bóc tách nội dung chương và dịch trực tiếp qua giao thức web của STV.

## Mirror / failover (v4, đo lại v6)
- Cả 4 domain `.app` / `.vip` / `.com` / `.pro` đều là mirror thật của cùng một site (đã kiểm chứng bằng curl 2026-11-08: cả 4 đều trả HTTP 200 và phục vụ được API mục lục).
- Extension tự thử lần lượt các mirror khi domain chính lỗi (`fetchWithMirrors()` trong `src/config.js`, danh sách trong config `MIRRORS` của `plugin.json`); mirror nào chạy được sẽ dùng cho các bước sau trong cùng một lần gọi.
- Độ trễ đo từ VM: 2026-11-08 `.com` chậm bất thường (7,8s) trong khi `.pro` 2,0s; đo lại 2026-11-09: `.app` 0,9s, `.vip` 3,9s, `.com` 2,1s, `.pro` 2,1s — `.com` không chậm ổn định nên giữ nguyên thứ tự `.vip` → `.com` → `.pro`, tiếp tục theo dõi.
- Domain `dns1.stv-appdomain-<số>.org` chỉ còn trong `regexp` của `plugin.json` (để app vẫn mở được link thư viện cũ); từ VM không kết nối được tới nó nên **không** đưa vào danh sách failover — không có mirror độc lập nào khác ngoài 4 domain trên. Kiểm chứng lại 2026-11-09: `dns1.stv-appdomain-1.org` resolve ra `198.18.112.197` (dải CGNAT), curl HTTP 000.

## Phân trang (v4)
- Trang kết quả tìm kiếm / danh sách của STV **không có** phần tử phân trang trong HTML (đã kiểm chứng bằng curl 2026-11-08: không có chuỗi `pagination` nào). Mỗi trang trả đúng 48 mục (`PAGE_SIZE = 48` trong `src/config.js`).
- Quy tắc: trang hiện tại trả đủ 48 mục thì còn trang sau (`nextToken` = số trang tiếp theo, dạng string); trả ít hơn thì hết (`nextToken = ""`, không bao giờ `null`).

## Cơ chế đọc chương (chap.js)
- Đọc chương cần `chapterkey`: xin mã grant từ `/io/grantcontext/context`, chạy mã đó trong WebView thật (`Engine.newBrowser()`) để sinh key, rồi ký MD5 (`x-stv-sign`, muối `STV_SIGN_SALT` trong `src/config.js`) gọi API đọc.
- Cơ chế này **chỉ chạy trên app thật** — từ VM/Node key suy ra khác key của WebView thật nên server trả mã 10002. Đừng "sửa" cơ chế này theo kết quả chạy trên VM.
- `fetch()` HTTP không set header `User-Agent` (dùng UA mặc định của runtime, theo AGENTS.md §6.10). Chuỗi UA Chrome/120 cũ chỉ còn dùng trong sandbox WebView nơi mã grant chạy (`STV_WEBVIEW_UA` trong `src/config.js`), vì mã grant đã kiểm chứng chạy đúng với giá trị đó trên máy thật.
- Tên thuộc tính mã hoá của mã grant (`UWNgB`, `tcYCI`) và muối MD5 đã tách thành hằng có tên trong `src/config.js` kèm chú thích nguồn gốc; nếu site đổi tên/muối thì cập nhật theo mã grant mới.
- Hàm MD5 inline trong `chap.js` là triển khai MD5 chuẩn RFC 1321 (kiểu md5.js của Paul Johnston); runtime đã bundle CryptoJS nên thực tế luôn dùng `CryptoJS.MD5`, nhánh inline chỉ là dự phòng.

## Thay đổi v6 (review 2026-11-08, sửa 2026-11-09)
- `detail.js` trả đủ chuẩn như các ext khác: thêm `url` (URL yêu cầu đã chuẩn hoá), `type: "novel"`, `format: "novel"`, và `genres` — map từ `og:novel:category` khi chuỗi đó chứa đúng tên một thể loại trong bảng `GENRES` (vd. "Đô thị ngôn tình" → chip Đô Thị); thể loại ngoài bảng (vd. "Hệ thống") thì không gán genre.
- `chap.js`: xoá MD5 inline ~150 dòng, thay bằng wrapper 3 dòng dùng `CryptoJS.MD5` qua `load('crypto.js')` (built-in của runtime; `src/crypto.js` inline từ `lib/crypto.js`, md5 khớp — cùng mẫu với lacatruyen). Đã kiểm chứng `CryptoJS.MD5` khớp `md5sum` hệ thống trên đúng chuỗi ký `x-stv-sign`.
- `chap.js` `waitBounded`: chỉ còn `sleep()` của runtime; bỏ nhánh `java.lang.Thread.sleep` (runtime cấm Java interop) và busy-wait. Nếu `sleep()` không tồn tại thì trả về ngay, retry code 7 vẫn chạy.
- `search.js` / `gen.js`: parse kết quả chung vào `src/helper.js` (`parseSearchPage`), cả hai cùng `load()` — sửa selector một chỗ.
- 0 kết quả / trang list trống giờ trả `Response.success([], "")` thay vì `Response.error` (chỉ dùng error cho lỗi mạng/HTTP/parse).

## Trạng thái truyện (detail.js, v4)
- `ongoing` đọc thật từ `<meta property="og:novel:status">` của trang chi tiết (`Còn tiếp` → true, `Hoàn thành` → false); trước đây hardcode `true`.
- Tên truyện lấy `namevi` (tiếng Việt, khớp tên hiển thị trên site và trong kết quả tìm kiếm) thay vì `name` (tiếng Trung gốc); tác giả ưu tiên `og:novel:author` (đã chuyển sang tiếng Việt).

## Fixture
- `test.json`: case cho gen, genre, search, detail, toc, chap. Truyện mẫu `faloo/1020583` ("Ta bởi vì chửi bậy!..."), Hoàn thành, 33 chương. Chap chương 1 đã test trên máy thật 2026-11-08 (code 0, nội dung mở đầu "Dựa vào! Có tiền như vậy...").
- `health.json`: probe trang chủ (marker CDN riêng `static.sangtacvietcdn.xyz` — trang chủ không có meta `og:site_name`, marker này mới là dấu riêng của site) + API mục lục truyện mẫu (marker tên chương 1).
