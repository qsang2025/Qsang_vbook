# Extension Truyện Hoàn (vBook)

Extension đọc truyện chữ tiếng Việt miễn phí từ **Truyện Hoàn** (`https://truyenhoan.com`).

## Tính năng
- Đầy đủ thể loại: Tiên Hiệp, Kiếm Hiệp, Huyền Huyễn, Đô Thị, Võng Du, Khoa Huyễn, Dị Giới...
- Danh mục: Truyện Hot, Mới Cập Nhật, Đã Hoàn Thành, Truyện Mới Đăng.
- Hỗ trợ phân trang danh sách truyện, phân trang tìm kiếm (`?tukhoa=...&paged=N`) và phân trang mục lục chương (`page.js` + `toc.js`, 50 chương/trang).
- Đọc toàn văn chương đầy đủ (`#chapter-c`), loại bỏ quảng cáo và script; tiêu đề chương thật trả về qua `data2`.

## Lưu ý quan trọng về mirror
- **Mã truyện KHÔNG nhất quán giữa các mirror**: `.4780` là *Vạn Cổ Thần Đế* ở truyenhoan.com nhưng là *Chỉ Vì Yêu* ở wetruyen.com (*Vạn Cổ Thần Đế* ở wetruyen là `.8404`). Vì vậy extension **không đổi host tự động** cho detail/toc/chap/page: mỗi truyện chỉ đọc trên đúng host của link gốc. Link thuộc host khác (kể cả dtruyen.com) sẽ báo lỗi tiếng Việt thay vì trả nhầm truyện khác.
- **Không có failover tự động cho detail/chap** vì lý do trên. Tùy chọn Domain trong cài đặt plugin (`truyenhoan.com` / `wetruyen.com`) chỉ đổi host dùng cho tìm kiếm và danh sách; truyện đã lưu từ mirror nào thì chỉ đọc được trên mirror đó.
- **dtruyen.com đã bỏ** khỏi danh sách mirror: domain này 301 hết về wetruyen.com nên không phải mirror độc lập.
- Trang detail của site **không expose thể loại riêng của truyện** nên detail không trả `genres`/`suggests`.

## Lưu ý về danh sách thể loại
- Link thể loại thật của site có hậu tố `/hoan` (ví dụ `/truyen-tien-hiep/hoan/`), đã sửa trong extension.
- Danh sách thể loại của site **chỉ liệt kê truyện ĐÃ HOÀN THÀNH** — đây là đặc tính của site, không phải lỗi.
