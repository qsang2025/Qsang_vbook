# Extension Mê Truyện Chữ (vBook)

Extension đọc truyện chữ tiếng Việt miễn phí từ **Mê Truyện Chữ VN** (`https://metruyenchu.com.vn`), hỗ trợ mirror qua `metruyenchuvn.com` và `metruyenchuvn.org` (failover tự động).

## Tính năng
- Đầy đủ thể loại Tiên Hiệp, Huyền Huyễn, Đô Thị, Võng Du, Khoa Huyễn, Dị Giới...
- Danh mục: Truyện Hot, Mới Cập Nhật, Đã Hoàn Thành.
- Hỗ trợ tải toàn bộ mục lục qua cơ chế phân trang AJAX API `/get/listchap/<storyId>`.
- Trích xuất toàn văn nội dung chương từ `.vung-doc .truyen`, lọc sạch quảng cáo.

## Ghi chú (v2, 2026-11-08)
- Tab "Mới Cập Nhật" đọc danh sách `.itemupdate` ở trang chủ `/` — đường dẫn cũ `/danh-sach/truyen-moi` trả HTTP 404.
- Mirror `metruyenchuvn.com` / `.org` chỉ redirect về domain chính (không phục vụ nội dung trực tiếp); failover vẫn thử chúng khi domain chính lỗi. `wikidichvn.com` bị Cloudflare chặn từ VM (HTTP 403) nên không có trong failover tự động — chỉ giữ trong danh sách Domain để chọn tay trên máy thật, cần kiểm chứng trên điện thoại trước khi đưa vào failover.
- Trang detail không có mục "truyện cùng thể loại / cùng tác giả" nên detail không có `suggests`.
- Đã bỏ 3 thể loại chết khỏi danh sách: Cạnh Kỹ, Huyền Nghi, Kỳ Ảo (trả HTTP 200 nhưng 0 truyện, không có trong menu thể loại của site).
- Case `chap.js` trong `test.json` dùng URL chương thật có ID (lấy từ TOC/AJAX); URL `/chuong-1` không ID bị site redirect 302 về trang detail nên không đọc được chương.
