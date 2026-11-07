# Extension La Cà Truyện (vBook)

Extension đọc truyện chữ từ **La Cà Truyện** (`https://lacatruyen.site`).

## Tính năng
- **Danh sách & Thể loại tốc độ cao:** Khai thác trực tiếp hệ thống JSON API (`/api/stories/*`, `/api/categories/list`, `/api/categories/get-story`) cho 8 bảng xếp hạng trang chủ và hơn 90 thể loại truyện.
- **Tìm kiếm thông minh:** Hỗ trợ tìm kiếm qua endpoint `/api/stories/get-search` kèm cơ chế fallback tự động sang `/api/stories/search`.
- **Chi tiết truyện SSR (`__NEXT_DATA__`):** Bóc tách chính xác tên truyện, tác giả, trạng thái, lượt xem, danh sách thể loại từ dữ liệu SSR Next.js.
- **Giải mã AES-256-CBC tự động:**
  - Tự động mã hóa payload và giải mã danh sách chương từ `/api/chapters/list-chapters` (hỗ trợ phân trang 500 chương/trang qua `page.js` + `toc.js` cho các bộ truyện dài trên 1.000 chương).
  - Giải mã 2 tầng (`MASTER_KEY` → `firstKey` → `secondKey`) cho nội dung chương trong `chap.js`.
  - Hỗ trợ đọc trước (`previewHtml`) ngay cả khi chưa đăng nhập, kèm đồng bộ phiên trình duyệt (`Engine.newBrowser()`) hoặc cấu hình `TOKEN`.

## Hướng dẫn cấu hình TOKEN (Đọc toàn văn chương yêu cầu đăng nhập)
1. Mở **Trình duyệt** tích hợp trong ứng dụng vBook, truy cập `https://lacatruyen.site` và đăng nhập tài khoản.
2. Hoặc lấy giá trị cookie `token=...` từ trình duyệt và dán vào mục **Cài đặt nguồn** (`TOKEN`) của tiện ích (lưu ý: tuyệt đối không nhập mật khẩu tài khoản vào cài đặt plugin).

## Attribution
- Tham khảo cơ chế API và giải mã AES của La Cà Truyện từ `ext-vbook-w_BaoBao666888` (`QuocBao`) và `ext_Ivan1hai` (`ivanzzz`).
