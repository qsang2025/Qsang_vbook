# Truyen4u — truyen4u.com

Extension đọc truyện chữ tiếng Việt miễn phí trên truyen4u.com
(fanfiction, ngôn tình, đam mỹ, truyện teen...). Tác giả: MuseAi.
Port từ AzTruyen v2 (cùng mẫu giao diện).

## Vòng đời

| Script | Cách hoạt động (kiểm chứng live 2026-11-12) |
|---|---|
| `home.js` | 2 tab tĩnh: Top Truyện Hay (`/#top`), Mới cập nhật (`/#moi`) — trang chủ có 2 mục, mỗi mục 12 truyện, không phân trang. |
| `genre.js` | 28 thể loại, đọc từ trang chủ (menu trên chỉ hiện 5, đủ 28 ở footer), gom theo slug. |
| `book.js` | Renderer chung: hàng truyện `div.col-sm-12.col-md-6.story` (bìa `img[data-src]`, tiêu đề `h2 a`, mô tả `p.crop-text-2.desc`); trang thể loại 20 truyện/trang, phân trang `?page=N` (nút `›`). |
| `detail.js` | Tên `h1.title`, bìa `og:image`, tác giả thật từ dòng đầu mô tả (`Tác Giả: ...`, chữ hoa/thường không ổn định, dự phòng người đăng `a[itemprop=author]`), thể loại `p.story_categories a[itemprop=genre]`, trạng thái từ dòng `Tình Trạng:` trong mô tả (dự phòng `p.story_completed`), số chương = số link chương thật trong `#chapters` (dedupe theo link, bỏ 2 mục Thông báo/Giới thiệu truyện mới). |
| `toc.js` | Chỉ lấy `ul.chapters` thứ 2 trong `div#chapters` ("Danh sách chương", toàn bộ chương theo đúng thứ tự đọc), giữ nguyên thứ tự DOM, dedupe theo link. KHÔNG sắp xếp/dedupe theo số chương N — truyện nhiều quyển đánh số lại theo quyển. Chương thật xác định theo TÊN (loại "Thông báo"/"Giới thiệu truyện mới"), không lọc theo URL — truyen4u có chương đặt slug tự do (vd chương duy nhất slug `hi`). URL chương dạng `/chuong-N-<tiêu-đề>-<id>/`, `/part-N-<id>/`, `/q-N-chuong-N-...-<id>/`, `/quyen-N-...-chuong-N-...-<id>/`, hoặc `/<slug-tự-do>-<id>/`. |
| `chap.js` | Nội dung `.chapter-content`, tiêu đề `h2.chapter-title` (chính thẻ h2 này mang `id="chapter"` — đừng nhầm với div nội dung). |
| `search.js` | Tìm kiếm HOẠT ĐỘNG (khác AzTruyen): `GET /tim-kiem/<từ-khóa>` (JS của site tự redirect sang URL này với `encodeURIComponent`), kết quả khớp mờ theo từ khóa, 20 truyện/trang, phân trang `?page=N` (nút `›`). POST `/` với `search_q` trả về trang chủ không lọc (vô dụng). |

## Giới hạn đã biết (của site, không phải của extension)

1. **Tìm kiếm khớp mờ.** `GET /tim-kiem/<từ-khóa>` trả kết quả khớp
   mờ theo từ khóa (vd "hoang hon" trả chủ yếu truyện có "Hoàng"/"Hoang"
   trong tên, tới 500 trang kết quả) — truyện cần tìm có thể không nằm
   trong 20 kết quả đầu.
2. **Mục lục truyện rất dài chưa kiểm chứng giới hạn.** Truyện mẫu
   231 chương liệt kê đủ 200 link còn lại (31 số thiếu do chương đã bị
   xoá khỏi site, không phải cắt bớt — các số thiếu không còn link nào
   trên trang, không có nút "xem thêm"/phân trang chương). AzTruyen cùng
   mẫu chỉ liệt kê 200 chương mới nhất với truyện 800 chương — chưa gặp
   truyện >200 chương còn đủ trên truyen4u nên chưa kiểm chứng giới hạn
   này ở đây. `detail.js` chỉ ghi chú "chỉ hiện ... chương mới nhất"
   khi tổng số chương site khai (JSON-LD `numberOfPages`) lớn hơn số
   link liệt kê.
3. **Không có mirror.** truyen2u.com và aztruyen.top dùng cùng mẫu giao
   diện nhưng là kho truyện riêng, không phải mirror của truyen4u.com —
   không đưa vào danh sách mirror.
