# 和图书 (hetushu.com)

Extension vBook cho trang truyện chữ giản thể **和图书** — huyền huyễn,
tiên hiệp, đô thị, lịch sử, võ hiệp... Toàn bộ HTML tĩnh, không JS,
không API, không Cloudflare, chương đọc miễn phí toàn văn, không khóa VIP.

- Site: https://www.hetushu.com
- Type: `novel`, locale: `zh_CN` (mặc định giản thể; site có nút chuyển
  繁體版 sang hetubook.com nhưng extension chỉ dùng bản giản thể)
- Version: 1, author: MuseAi

## Cấu trúc

| Script | Chức năng |
|---|---|
| `home.js` | 7 tab tĩnh: 全部小说, 榜单, 玄幻小说, 仙侠小说, 都市小说, 完本, 连载 |
| `genre.js` | Đủ 13 thể loại (`/book/index.php?type=...`) |
| `book.js` | Renderer danh sách chung: trang thể loại (`ul#list.book_list`, 16/trang, phân trang `?page=N`) và bảng xếp hạng (`dl#body`, 20 truyện, 1 trang) |
| `search.js` | GET `/search/?keyword=` — kết quả `dl#body > dd`, không phân trang |
| `detail.js` | `.book_info`: tên (h2), tác giả, thể loại, số chữ, mô tả (`.intro`), trạng thái từ class `finish` (完本) / `continue` (连载), tổng số chương (đếm link `dl#dir`) |
| `toc.js` | Mục lục nằm ngay trên trang chi tiết (`dl#dir dd a`), 1 trang duy nhất kể cả sách 1.235 chương — không cần `page.js` |
| `chap.js` | `div#content`: bỏ `.mask`, đổi `</div>` thành `<br>` (mỗi đoạn văn là một `<div>`), rồi `cleanHtml` |

## Ghi chú khảo sát (2026-11-10)

- Truyện mẫu: **剑来** — `/book/10195/index.html`, 烽火戏诸侯, 仙侠小说,
  1289.43 vạn chữ, 完本, 1.235 chương; chương 1
  `/book/10195/7144725.html` mở đầu "宋集薪愣了愣…"; chương cuối (番外 14)
  `/book/10195/7145959.html` toàn văn ~16.360 ký tự.
- Tìm `剑来` ra đúng 1 kết quả là bản gốc. Tìm `诡秘之主` ra 8 kết quả
  (gồm đồng nhân).
- **Search trả 302 về trang chủ khi không có kết quả** — `search.js` nhận
  diện trang chủ (title "和图书") và trả danh sách rỗng. Thỉnh thoảng
  request đầu tiên từ IP mới cũng bị 302 thoáng qua; tìm lại là được.
- Trang thể loại: trạng thái sách lấy từ `span.complete` (完本); không có
  span nghĩa là 连载. Trang `/book/index.php` mặc định liệt kê 完本 trước.
- Bảng xếp hạng `/top/index.php`: 20 truyện, không phân trang.
- Icon: favicon thật của site (chữ 书 trắng trên nền xanh lá), upscale
  32×32 lên 200×200 bằng PIL LANCZOS.

## Giới hạn đã biết

- Chưa xác minh mirror nào của hetushu.com (hetubook.com là bản phồn thể,
  chưa kiểm chứng giao diện có giống hệt không) nên `MIRROR_LIST` để trống.
- Mục `suggests` ở detail để trống: cột phải có mục bảng xếp hạng nhưng
  HTML tĩnh để trống (nạp bằng JS).
- Trạng thái sách chỉ suy ra từ class `finish`/`continue` của `.book_info`
  (đã kiểm chứng cả 2 dạng: 剑来 `finish`, 苟在神诡世界 `continue`).
