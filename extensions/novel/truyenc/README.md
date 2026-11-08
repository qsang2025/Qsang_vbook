# Extension TruyenC (vBook)

Extension đọc truyện chữ online miễn phí từ **TruyenC** (`https://truyenc.net`).

## Tính năng
- Đầy đủ truyện dịch và convert chất lượng cao: Tiên Hiệp, Huyền Huyễn, Đô Thị, Võng Du, Hệ Thống, Đồng Nhân...
- Danh mục phong phú: Truyện Hot, Mới Cập Nhật, Đã Hoàn Thành.
- Giao diện SSR sạch sẽ, ảnh bìa sắc nét lưu trên CloudFront CDN.
- Danh sách chương lấy từ API chính thức của site (`/api/stories/{slug}/chapters`) nên có đủ tiêu đề thật của mọi chương và đúng tổng số chương.

## Ghi chú kỹ thuật (v3, 2026-11-08)
- **TOC qua API chính thức**: site có API danh sách chương (`GET /api/stories/{slug}/chapters?page=N&limit=100`, tối đa 100/trang, `meta.total_items` là tổng số thật). Extension gọi lần lượt các trang và ghép theo `chapter_number`. Số chương trong URL lệch với số chương hiển thị (ví dụ Linh Kiếm Tôn: URL `/chuong-5418` có tiêu đề thật "Chương 5424: Đại kết cục (hạ)", độ lệch tăng dần theo truyện) nên không tự chế tên "Chương N" và không cộng hằng số. Trang API nào lỗi thì bù bằng mục "Chương N" (URL vẫn đúng) rồi đi tiếp; quá 120 trang API thì tự chế phần còn lại. Nếu API hỏng hoàn toàn thì đọc trang chi tiết HTML: tổng số từ neo thật (`numberOfPages` / `"chapters":N` / "Xem tất cả (N chương)"), tiêu đề thật của 4 chương mới nhất từ link trên trang.
- **Tìm kiếm không phân trang thật**: mọi kết quả nằm ở trang 1, `?page=2` trả 0 mục (kiểm chứng bằng curl 2026-11-08). Khi tìm kiếm chính trả 0 kết quả thì chạy đường dự phòng qua API tìm kiếm chính thức của site (`API_BASE/stories?q=...`). Đường dự phòng cũ `/danh-sach/truyen-moi-0-0-0?keyword=` đã bỏ vì kiểm chứng thấy nó bỏ qua keyword và trả danh sách truyện mới nhất (kết quả sai).
- **Mirror**: `www.truyenc.net` đã kiểm chứng còn sống và phục vụ đúng nội dung; failover tự động qua `MIRROR_LIST` trong `config.js`.
- **Cloudflare**: `lib/fetch-helpers.js` phát hiện cả trang challenge trả HTTP 200 (marker trong body + header `cf-mitigated: challenge`) và thử browser fallback thay vì parse trang challenge như trang thường; `fetchJson()` kiểm tra marker challenge trước khi `JSON.parse`.
- **Chương không tồn tại**: chương ngoài tầm (ví dụ `/chuong-99999`) trả HTTP 200 với title "Chương không tồn tại" và `<article>` rỗng — extension báo lỗi tiếng Việt rõ ràng thay vì trả nội dung rỗng.
- **Nội dung chương chỉ lấy trong `<article>`** (không gom mọi `<p>` trên trang để tránh lẫn nav/footer); `data2` của chap là tiêu đề chương thật lấy từ `<title>`.
