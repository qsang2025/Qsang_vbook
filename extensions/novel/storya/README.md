# Storya (storya.click)

Đọc truyện chữ online miễn phí trên Storya — đọc đủ chương, không cần đăng nhập.

- Site Next.js, SSR đầy đủ; chi tiết `/vi/stories/<slug>`, chương
  `/vi/stories/<slug>/<chapter-slug>`, nội dung chương trong
  `div.reader-content`.
- Mục lục phân trang `?cpage=N` (100 chương/trang), `?order=asc` cho thứ tự
  tăng dần; tìm kiếm `GET /vi/search?q=` — chỉ trả kết quả khi gõ có dấu.
- Port từ MeoU storya v7 (fork trên đĩa, src đọc được). Base Klein storya v2
  dùng API `/api/v1` đã chết (404) — bỏ.
- Mirror: `www.storya.click` (HTTP 200, cùng nội dung).
