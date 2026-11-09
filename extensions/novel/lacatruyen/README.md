# Extension La Cà Truyện (vBook)

Extension đọc truyện chữ từ **La Cà Truyện** (`https://lacatruyen.site`).

## Tính năng
- **Danh sách & Thể loại tốc độ cao:** Khai thác trực tiếp hệ thống JSON API (`/api/stories/*`, `/api/categories/list`, `/api/categories/get-story`) cho 8 bảng xếp hạng trang chủ và hơn 90 thể loại truyện.
- **Tìm kiếm thông minh:** Hỗ trợ tìm kiếm qua endpoint `/api/stories/get-search` kèm cơ chế fallback tự động sang `/api/stories/search`.
- **Chi tiết truyện SSR (`__NEXT_DATA__`):** Bóc tách chính xác tên truyện, tác giả, trạng thái, lượt xem, danh sách thể loại từ dữ liệu SSR Next.js. Trang chi tiết có chip "Truyện cùng thể loại" mở danh sách truyện tương tự (`/api/stories/similar`).
- **Giải mã AES-256-CBC tự động:**
  - Tự động mã hóa payload và giải mã danh sách chương từ `/api/chapters/list-chapters` (hỗ trợ phân trang 500 chương/trang qua `page.js` + `toc.js` cho các bộ truyện dài — tối đa 50 trang, tức 25.000 chương).
  - Giải mã 2 tầng (`MASTER_KEY` → `firstKey` → `secondKey`) cho nội dung chương trong `chap.js`.
  - Hỗ trợ đọc trước (`previewHtml`) ngay cả khi chưa đăng nhập; khi chưa có TOKEN hoặc TOKEN hết hạn, `chap.js` thử lấy phiên từ trình duyệt vBook (`Engine.newBrowser()`) nếu người dùng đã đăng nhập trong trình duyệt.
- **File `src/crypto.js`:** bản CryptoJS dùng để giải mã AES (copy từ `lib/crypto.js` của repo, `toc.js`/`chap.js`/`page.js` đều `load('crypto.js')` trước `load('config.js')`).

## Lưu ý quan trọng
- **Đọc chương yêu cầu đăng nhập:** La Cà Truyện khóa nội dung chương sau đăng nhập ngay cả với chương miễn phí (chưa đăng nhập chỉ có `previewHtml`). Cách đọc đầy đủ: đăng nhập trong trình duyệt vBook rồi mở chương (extension tự thử lấy phiên trình duyệt), hoặc dán cookie `token=...` vào cài đặt `TOKEN` của extension. Tuyệt đối không nhập mật khẩu tài khoản vào cài đặt plugin.
- **`MASTER_KEY` là điểm giòn:** khóa AES giải mã lấy từ mã JavaScript công khai của chính website (không phải credential người dùng) nên bắt buộc phải có trong code thì extension mới chạy được. Nếu website xoay khóa, mục lục và chương sẽ lỗi đồng loạt — từ v6 có tripwire `verifyMasterKey()` trong `config.js` (giải mã một mẫu đã biết) để `toc.js`/`chap.js` báo lỗi rõ ràng "Khóa giải mã ... đã thay đổi" thay vì trả rỗng lặng lẽ; các case `toc.js`/`chap.js` trong `test.json` (kỳ vọng tiêu đề chương 1 "Chương 1 - Ngoại Hương Nhân") cũng sẽ fail ngay để phát hiện sớm.
- **Chưa có mirror độc lập:** cả 5 domain phụ (`.com`/`.live`/`.homes`/`.store`/`.online`) đều redirect về `.site` nên không thể failover tự động (kiểm chứng lại bằng curl 2026-11-09, tất cả về `.site` HTTP 200; `.store` đi qua `.club` rồi mới về `.site`); từ v6 mục `DOMAIN` trong cài đặt chỉ còn `.site` để khỏi gây hiểu nhầm là có failover. Regexp và `normalizeUrl` vẫn nhận cả 6 TLD để link cũ đã lưu trong thư viện còn khớp.
- **Quirk `firstKey`:** `comment_count` của site thường là `[]` (mảng rỗng) và `rs` chỉ có khóa `"0"`–`"99"` nên `firstKey` tính ra là chuỗi `"undefined"` — ĐÚNG là khóa thật (đã xác minh bằng openssl). Không "sửa" chỗ này thành kiểm tra `undefined` hay ép kiểu `comment_count`.

## Hướng dẫn cấu hình TOKEN (Đọc toàn văn chương yêu cầu đăng nhập)
1. Mở **Trình duyệt** tích hợp trong ứng dụng vBook, truy cập `https://lacatruyen.site` và đăng nhập tài khoản.
2. Hoặc lấy giá trị cookie `token=...` từ trình duyệt và dán vào mục **Cài đặt nguồn** (`TOKEN`) của tiện ích (lưu ý: tuyệt đối không nhập mật khẩu tài khoản vào cài đặt plugin).

## Attribution
- Tham khảo cơ chế API và giải mã AES của La Cà Truyện từ `ext-vbook-w_BaoBao666888` (`QuocBao`) và `ext_Ivan1hai` (`ivanzzz`).
