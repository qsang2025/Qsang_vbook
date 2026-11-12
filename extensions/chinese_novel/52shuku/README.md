# 52书库 (52shuku.net)

Đọc truyện chữ tiếng Trung trên 52shuku.net — chủ yếu truyện hoàn thành.

## Đặc điểm site (khảo sát 2026-11-13)

- **Thể loại:** 15 trang thể loại có layout `article.excerpt` (~25–27 truyện/trang, phân trang `/index_<N>.html`). Các trang `/nan/`, `/DanMei/`, `/QiTa/`, `/Top/`, `/tuijian/` là trang gợi ý, không có `article.excerpt` nên không dùng làm tab/thể loại.
- **Tìm kiếm:** `GET /so/search.php?q=<từ khóa>` hoạt động (20 kết quả, **không phân trang** — `page=2` trả giống trang 1).
- **Chi tiết:** h1 dạng `<tên>_<tác giả>` / `` / ``; mô tả ngắn ở `article.article-content p[1]`; chuyên mục ở đoạn `所属专题：<tag>`; không có ảnh bìa.
- **Mục lục:** danh sách trang `第N页` trên trang chi tiết (1.347 mục với 裂天空骑) — site phân trang **toàn bộ văn bản truyện**, không phân theo chương. Trang chi tiết là trang 1 (chỉ có teaser), `_2.html` là trang 2 (chứa trọn ch.1 + đầu ch.2).
- **Chương:** mỗi trang `_N.html` có ~87 thẻ `<p>`; 7 đoạn đầu lặp lại khối giới thiệu sách, đoạn cuối là `传送门` + quảng cáo — `chap.js` đã cắt cả hai đầu. Chương đọc **đủ**, không cần đăng nhập, không VIP, không preview — đã đối chiếu đúng truyện gốc (không phải văn bản ghép như cgsdlx).
- **Mirror:** `www.52shuku.vip` (do chính site ghi trong dòng Tips), `52shuku.net` bare — cả hai đều HTTP 200.

## Nguồn gốc

Port từ 52shuku v12 của Moleys (fork trên đĩa, đọc được, không mã hóa — bản BaoBao666888 thì mã hóa, không dùng được làm code), viết lại hoàn toàn theo hợp đồng hiện tại: base dùng `let`/`const`/arrow function, `return null`, không pacing, không có `search.js`, `gen.js` không có trong script map.
