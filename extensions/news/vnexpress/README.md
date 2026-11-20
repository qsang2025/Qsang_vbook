# VnExpress (loại `news`)

Đọc tin VnExpress trong vBook: tab theo chuyên mục, danh sách bài, tìm kiếm,
chạm bài là mở thẳng reader (nghe TTS được như đọc một chương).

- Nguồn: https://vnexpress.net — HTML render phía server, khảo sát live 2026-11-20.
- Script: `home` / `genre` (tab tĩnh), `search` (danh sách chuyên mục + tìm kiếm
  qua timkiem.vnexpress.net), `article` (nội dung bài từ `.fck_detail`).
- Phân trang chuyên mục: `/<chuyên-mục>-p<n>`; tìm kiếm: `&page=<n>`.
- Bài trả phí của VnExpress: báo lỗi rõ ràng, không vượt paywall.
- Extension `news` đầu tiên của repo (task 117, muse-teamwork). Hợp đồng loại
  news theo research/110-news-port.md của muse-teamwork: không có
  detail/toc/chap, chạm item chạy thẳng `article.js`.
