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
| `rate-limit.js` (copy verbatim từ `lib/`) | Qsang_vbook `lib/rate-limit.js` |
| Icon | favicon của wikicv.org, resize 200×200 PNG |

License repo: MIT (copyright Dương Nguyễn Quốc Sáng, 2026).

## Cách hoạt động

- Trang chủ: 5 tab tĩnh (Chương mới, Truyện nam, Nữ tần, Đam mỹ,
  Bảng xếp hạng) → `book.js` tải danh sách SSR (20–50 truyện/trang).
- Thể loại: 18 mục tĩnh (tag/genre/status ID lấy từ trang chủ) →
  `book.js` qua `/tim-kiem?qs=2&...`.
- Chi tiết: SSR `.cover-info` (tên, tác giả, trạng thái, bìa) +
  `.book-desc-detail` (mô tả) + thể loại.
- Tìm kiếm: GET `/tim-kiem?q=<kw>&qs=1&start=<n>` → `.book-item`.
- Mục lục: API `/book/index?bookId=..&start=..&size=..&signKey=..&sign=..`
  với `sign = sha256(fuzzySign(signKey + start + size))`;
  `fuzzySign` offset và `signKey` đọc động từ trang chi tiết (cả hai
  xoay theo mỗi lần tải trang — phải dùng đúng cặp của cùng một lần tải).
  Giới hạn server: `size` tối đa 501, gọi lặp tối đa 20 vòng.
- Chương: SSR `#bookContentBody`, làm sạch quảng cáo/script.

## Giới hạn đã biết (kiểm chứng 2026-11-11, chưa đăng nhập)

Site chia làm hai nửa: **không cần đăng nhập** (chi tiết, chương,
Chương mới / Truyện nam / Nữ tần / Đam mỹ) và **cần đăng nhập**
(tìm kiếm, thể loại, bảng xếp hạng, mục lục API):

- Tìm kiếm `/tim-kiem?q=..&qs=1` khi chưa đăng nhập chỉ trả vỏ trang
  "Đăng nhập để xem nội dung", 0 kết quả → `search.js` báo lỗi tiếng
  Việt rõ ràng thay vì trả rỗng.
- Thể loại `/tim-kiem?qs=2&tag=..` tương tự → `book.js` báo lỗi tương tự.
- Bảng xếp hạng `/bang-xep-hang` tương tự (0 mục khi chưa đăng nhập).
- Mục lục API `/book/index` trả **HTTP 404** khi chưa đăng nhập, dù
  sign tính đúng (đã kiểm chứng bằng cả code SHA-256 của site lẫn
  `sha256sum`, nhiều biến thể sign, có/không header XHR/Referer/cookie).
  Khả năng cao API yêu cầu session đăng nhập.

## Cách dùng khi đã đăng nhập

1. Trong app vBook, mở trình duyệt trong app tới wikicv.org và đăng nhập.
2. Mở cài đặt của nguồn "Wiki Dịch", dán cookie phiên vào ô
   **Cookie wikicv** (chỉ dán giá trị cookie, không dán mật khẩu;
   không commit cookie thật vào repo).
3. Tìm kiếm / thể loại / mục lục sẽ dùng cookie đó qua header `Cookie`.

Lưu ý: cookie có thể hết hạn — hết hạn thì đăng nhập lại và dán cookie mới.

## Kiểm chứng

- Khảo sát VM 2026-11-11: trang chủ 200; chi tiết Ất đại 200
  (bookId `6a2164653bb6eb290441d20f`, Hoàn thành, 178 chương);
  chương 1 `#bookContentBody` ~9.065 ký tự, mở đầu "Lại tới nữa.";
  `/chuong-moi` 20 mục; `/truyen-nam`, `/nu-tan`, `/dam-my` 50 mục mỗi trang.
- Test trên máy thật: xem `WIKICV-PROGRESS.md` §7.
