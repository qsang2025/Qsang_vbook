# Extension Mê Truyện Chữ (vBook)

Extension đọc truyện chữ tiếng Việt miễn phí từ **Mê Truyện Chữ VN** (`https://metruyenchu.com.vn`), hỗ trợ mirror qua `metruyenchuvn.com` và `metruyenchuvn.org` (failover tự động).

## Tính năng
- Đầy đủ thể loại Tiên Hiệp, Huyền Huyễn, Đô Thị, Võng Du, Khoa Huyễn, Dị Giới...
- Danh mục: Truyện Hot, Mới Cập Nhật, Đã Hoàn Thành.
- Hỗ trợ tải toàn bộ mục lục qua cơ chế phân trang AJAX API `/get/listchap/<storyId>`.
- Trích xuất toàn văn nội dung chương từ `.vung-doc .truyen`, lọc sạch quảng cáo.

## Ghi chú (v4, 2026-11-09 — review ngày 2026-11-08)
- N1: mọi script có fetch (search/detail/toc/chap/gen) đã nối `fetch-helpers.js` + `challenge-handler.js` (md5 khớp `lib/`) qua `fetchPageDoc()` trong `helper.js` mới: `fetchDocWithFallback` (retry 429, quét marker challenge cả khi HTTP 200, thử browser fallback) + khi đường chính thất bại thì probe 1 lần để phân biệt challenge/login với lỗi mạng/HTTP, trả `Response.error` tiếng Việt có hướng dẫn vượt challenge/đăng nhập. Site chính hiện chưa bật challenge (curl 2026-11-09: home/search/detail/chap đều 200, không marker) nên đây là phòng thủ; vòng AJAX của `toc.js` đọc text 1 lần rồi `JSON.parse`, gặp challenge thì dừng vòng lặp và trả phần mục lục đã gom được.
- N2: parse `.truyen-list .item` dùng chung `parseStoryItems()` trong `helper.js`, gọi từ cả `search.js` và `gen.js`.
- N3: tìm kiếm 0 kết quả / trang list trống trả `Response.success([], "")`, chỉ dùng error cho lỗi mạng/HTTP/parse.
- C1: `wikidichvn.com` kiểm chứng lại bằng curl 2026-11-09 — vẫn 403 trang challenge Cloudflare thật ("Just a moment...", `challenges.cloudflare.com`) từ VM, không phải domain chết. GIỮ trong DOMAIN select để chọn tay trên máy thật (nơi có cookie `cf_clearance`), vẫn chưa kiểm chứng trên điện thoại — cần Anh mở app, chọn domain này rồi mở 1 truyện để quyết định đưa vào failover hay xóa khỏi select.
- C2: `toc.js` vẫn fetch tuần tự từng trang AJAX (không delay giữa các trang, không chạy song song — site chưa biết giới hạn tốc độ; truyện 1.844 chương đã chạy xong trên máy 2026-11-08). Chỉ ghi chú trong code, không tối ưu mù.
- C3: fallback `.content`/`#content` trong `chap.js` chỉ nhận khi text dài > 200 ký tự — trang chương thật có `<div class=" content ">` là bảng cài đặt giao diện (~96 ký tự), không có guard này sẽ bị trả về như nội dung chương (nội dung chương thật ~13.000 ký tự).
- Tab "Mới Cập Nhật" đọc danh sách `.itemupdate` ở trang chủ `/` — đường dẫn cũ `/danh-sach/truyen-moi` trả HTTP 404.
- Mirror `metruyenchuvn.com` / `.org` chỉ redirect về domain chính (không phục vụ nội dung trực tiếp); failover vẫn thử chúng khi domain chính lỗi. `wikidichvn.com` bị Cloudflare chặn từ VM (HTTP 403) nên không có trong failover tự động — chỉ giữ trong danh sách Domain để chọn tay trên máy thật, cần kiểm chứng trên điện thoại trước khi đưa vào failover.
- Trang detail không có mục "truyện cùng thể loại / cùng tác giả" nên detail không có `suggests`.
- Đã bỏ 3 thể loại chết khỏi danh sách: Cạnh Kỹ, Huyền Nghi, Kỳ Ảo (trả HTTP 200 nhưng 0 truyện, không có trong menu thể loại của site).
- Case `chap.js` trong `test.json` dùng URL chương thật có ID (lấy từ TOC/AJAX); URL `/chuong-1` không ID bị site redirect 302 về trang detail nên không đọc được chương.
