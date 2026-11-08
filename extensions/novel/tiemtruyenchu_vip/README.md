# Extension Tiệm Truyện Chữ (vBook)

Extension đọc truyện chữ từ **Tiệm Truyện Chữ** (`https://tiemtruyenchu.cloud`).

## Tính năng
- Khai thác trực tiếp hệ thống **Public JSON API v1** (`/api/v1/stories`, `/api/v1/ranking`, `/api/v1/stories/<id>`) tốc độ cao, không cần đăng nhập cho toàn bộ:
  - Danh sách trang chủ (Mới cập nhật, Truyện mới, Truyện Full, Xem nhiều, Truyện Nam/Nữ, 5 Bảng xếp hạng).
  - 19 thể loại truyện đầy đủ.
  - Tìm kiếm theo từ khóa và xem thông tin chi tiết truyện.
  - Tự động lấy danh sách chương với tiêu đề thật từ mảng `chapters` ở top-level của API chi tiết (`/api/v1/stories/<id>`, mỗi item có `chapterNumber` + `title`), hoặc trích xuất tiêu đề chương đầy đủ từ DOM khi đã có phiên đăng nhập.
- Chỉ dùng tên miền `https://tiemtruyenchu.cloud`. Tên miền cũ `tiemtruyenchu.com` đã ngừng hoạt động (trang thông báo tạm ngừng); các link cũ lưu dưới `.com` được chuẩn hoá về `.cloud` khi xử lý.
- Hỗ trợ đọc nội dung chương qua API đọc nhanh (`/api/prefetch-chapter`), Cookie cấu hình (`COOKIE`) và tự động đồng bộ phiên đăng nhập từ trình duyệt tích hợp của vBook (`Engine.newBrowser()`). Chip thể loại ở trang chi tiết gửi slug thể loại (`cat=huyen-huyen`), không gửi tên hiển thị.

## Hướng dẫn đọc nội dung chương
Trang nguồn `tiemtruyenchu.cloud` yêu cầu tài khoản đăng nhập khi đọc nội dung chương:
1. Mở **Trình duyệt** tích hợp trong ứng dụng vBook, truy cập `https://tiemtruyenchu.cloud/login` và đăng nhập tài khoản. Extension sẽ tự động lấy và lưu phiên đăng nhập khi mở chương.
2. Hoặc dán giá trị Cookie phiên (`connect.sid=...`) vào mục **Cài đặt nguồn** (`COOKIE`) của extension (lưu ý: không bao giờ nhập mật khẩu trực tiếp vào cài đặt plugin).

## Attribution
- Tham khảo cấu trúc API `/api/v1/*` và cơ chế lấy phiên trình duyệt từ `ext_Ivan1hai` (`ivanzzz`).
- Tham khảo bộ chọn HTML DOM từ `vbook-extension_sonzin` (`sonzin`) và `vbook-ext_Evamirion` (`Vearn`).
