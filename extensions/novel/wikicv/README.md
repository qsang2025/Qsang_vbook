# Wiki Dịch (wikicv.org)

Extension đọc truyện tiếng Hoa qua bản dịch máy Hán-Việt trên Wiki Dịch
(truyenwikidich.net → wikicv.org). Port từ **wikicv v1 của alexsonxxx**
(fork `vbook_alexsonxxx`, `extensions/wikicv/`), chuẩn hóa theo quy tắc
nhà Qsang_vbook (author MuseAi; `gen.js` đổi tên thành `book.js`; thêm
pacing chống rate-limit; lỗi tiếng Việt; bỏ User-Agent tự xoay).

## Attribution

| Phần | Nguồn |
| ---- | ----- |
| Toàn bộ logic home/genre/detail/search/page/toc/chap + `config.js` (BASE_URL, cookie helper, SHA-256) | alexsonxxx, wikicv v1 (fork `vbook_alexsonxxx`) |
| `comment.js` (bình luận, v5) + mục `comment` trong `detail.js` | Viết mới từ khảo sát endpoint `/comment` công khai của site (§12) — không copy code mã hóa của Darkrai9x v29 |
| `rate-limit.js` (copy verbatim từ `lib/`) | Qsang_vbook `lib/rate-limit.js` |
| Icon | favicon của wikicv.org, resize 200×200 PNG |

License repo: MIT (copyright Dương Nguyễn Quốc Sáng, 2026).

## Cách hoạt động

- Trang chủ: 6 tab tĩnh (Chương mới, Truyện nam, Nữ tần, Đam mỹ, Review,
  Bảng xếp hạng) → `book.js` tải danh sách SSR (10–50 truyện/trang).
- Thể loại: 32 mục tĩnh (18 gốc + 7 thể loại bổ sung + 7 chuyên mục
  Review; tag/genre/status ID lấy từ trang chủ) → `book.js` qua
  `/tim-kiem?qs=2&...` (7 thể loại bổ sung chỉ chạy sau đăng nhập)
  hoặc `/review?cat=..` (không cần đăng nhập).
- Chi tiết: SSR `.cover-info` (tên, tác giả, trạng thái, bìa) +
  `.book-desc-detail` (mô tả) + thể loại + mục bình luận (`comment.js`
  qua API `/comment?bookId=..&start=..&order=newest`, 10 mục/trang,
  không cần đăng nhập; `bookId` đọc từ inline script trang chi tiết,
  số bình luận lấy từ `.book-stats`).
- Bình luận: chỉ đọc. `comment.js` làm phẳng cây trả lời lồng nhau
  (`children`, thụt bằng tiền tố "↳ " theo cấp), tên = "tên • Cách đây X",
  mô tả = nội dung đã strip HTML (+ trích dẫn `<blockquote>` nối sau
  "— Trích:"), link = chương đính kèm (khi `chapter` là object đầy đủ;
  khi chỉ là `{$oid}` trần thì không có link). Không có đánh giá sao /
  like bình luận trên site; ghi bình luận cần đăng nhập nên ngoài phạm vi.
- Tìm kiếm: GET `/tim-kiem?q=<kw>&qs=1&start=<n>` → `.book-item`.
- Mục lục: API `/book/index?bookId=..&start=..&size=..&signKey=..&sign=..`
  với `sign = sha256(fuzzySign(signKey + start + size))`;
  `fuzzySign` offset và `signKey` đọc động từ trang chi tiết (cả hai
  xoay theo mỗi lần tải trang — phải dùng đúng cặp của cùng một lần tải).
  Giới hạn server: `size` tối đa 501, gọi lặp tối đa 20 vòng.
- Chương: SSR `#bookContentBody`, làm sạch quảng cáo/script.

## Giới hạn đã biết (kiểm chứng 2026-11-11, chưa đăng nhập)

Site chia làm hai nửa: **không cần đăng nhập** (chi tiết, chương, mục lục,
Chương mới / Truyện nam / Nữ tần / Đam mỹ / Review) và **cần đăng nhập**
(tìm kiếm, thể loại, bảng xếp hạng):

- Tìm kiếm `/tim-kiem?q=..&qs=1` khi chưa đăng nhập chỉ trả vỏ trang
  "Đăng nhập để xem nội dung", 0 kết quả → `search.js` báo lỗi tiếng
  Việt rõ ràng thay vì trả rỗng.
- Thể loại `/tim-kiem?qs=2&tag=..` tương tự → `book.js` báo lỗi tương tự.
- Bảng xếp hạng `/bang-xep-hang` tương tự (0 mục khi chưa đăng nhập).
- Mục lục API `/book/index` **KHÔNG cần đăng nhập**: `signKey` của API
  ràng buộc theo IP client (đổi theo mỗi lần tải trang chi tiết), không
  phải theo session đăng nhập — máy thật IP ổn định nên chạy được
  (kiểm chứng trên máy: đủ 179 mục không cần cookie). VM curl không
  test được mục lục vì IP egress xoay theo request. Gặp HTTP 404 thì
  `toc.js` tự tải lại trang chi tiết lấy bộ sign mới và thử lại 1 lần
  (đúng bản chất lỗi: IP đổi giữa 2 request).
- 3 tab Truyện nam / Nữ tần / Đam mỹ bị site giới hạn 50 truyện (không
  có phân trang) — không sửa được phía extension. Trang Review phân
  trang 10/trang (`?start=10/20...`); `book.js` tự tính cỡ trang theo
  URL nên lật trang không bị nhảy mục.

## Cách dùng khi đã đăng nhập

1. Trong app vBook, mở trình duyệt trong app tới wikicv.org và đăng nhập.
2. Mở cài đặt của nguồn "Wiki Dịch", dán cookie phiên vào ô
   **Cookie wikicv** (chỉ dán giá trị cookie, không dán mật khẩu;
   không commit cookie thật vào repo).
3. Tìm kiếm / thể loại / bảng xếp hạng sẽ dùng cookie đó qua header
   `Cookie` (mục lục không cần cookie).

Lưu ý: cookie có thể hết hạn — hết hạn thì đăng nhập lại và dán cookie mới.

## Kiểm chứng

- Khảo sát VM 2026-11-11: trang chủ 200; chi tiết Ất đại 200
  (bookId `6a2164653bb6eb290441d20f`, Hoàn thành, 178 chương);
  chương 1 `#bookContentBody` ~9.065 ký tự, mở đầu "Lại tới nữa.";
  `/chuong-moi` 20 mục; `/truyen-nam`, `/nu-tan`, `/dam-my` 50 mục mỗi trang.
- Test trên máy thật: xem `WIKICV-PROGRESS.md` §6.
