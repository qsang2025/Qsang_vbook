# AzTruyen — aztruyen.top

Extension đọc truyện chữ tiếng Việt miễn phí trên aztruyen.top
(fanfiction, ngôn tình, đam mỹ, truyện teen...). Tác giả: MuseAi.

## Vòng đời

| Script | Cách hoạt động (kiểm chứng live 2026-11-11) |
|---|---|
| `home.js` | 2 tab tĩnh: Top Truyện Hay (`/#top`), Mới cập nhật (`/#moi`) — trang chủ có 2 mục, mỗi mục 12 truyện, không phân trang. |
| `genre.js` | 28 thể loại, đọc từ menu trang chủ, gom theo slug. |
| `book.js` | Renderer chung: hàng truyện `div.col-sm-12.col-md-6.story` (bìa `img[data-src]`, tiêu đề `h2 a`, mô tả `p.crop-text-2.desc`); trang thể loại 20 truyện/trang, phân trang `?page=N` (nút `›`). |
| `detail.js` | Tên `h1.title`, bìa `og:image`, tác giả thật từ dòng đầu mô tả (`Tác Giả: ...`, chữ hoa/thường không ổn định, dự phòng người đăng `a[itemprop=author]`), thể loại `p.story_categories a[itemprop=genre]`, trạng thái từ dòng `Tình Trạng:` trong mô tả (dự phòng `p.story_completed` — có khi lệch, vd "Ly hôn..." mô tả ghi Hoàn Thành nhưng `p.story_completed` ghi Đang cập nhật), số chương = số link chương thật trong `#chapters` (dedupe theo link, bỏ 2 mục Thông báo/Giới thiệu truyện mới). |
| `toc.js` | Chỉ lấy `ul.chapters` thứ 2 trong `div#chapters` ("Danh sách chương", toàn bộ chương theo đúng thứ tự đọc), giữ nguyên thứ tự DOM, dedupe theo link (key = chapterId = cụm số cuối URL). KHÔNG sắp xếp/dedupe theo số chương N — truyện nhiều quyển đánh số lại theo quyển (Q.1 - Chương 63 và Q.2 - Chương 63 cùng tồn tại). URL chương dạng `/chuong-N-<tiêu-đề>-<id>/`, `/part-N-<id>/`, `/q-N-chuong-N-...-<id>/`, `/quyen-N-...-chuong-N-...-<id>/`. |
| `chap.js` | Nội dung `.chapter-content`, tiêu đề `h2.chapter-title`. |
| `search.js` | KHÔNG CÓ (xem dưới đây). |

## Giới hạn đã biết (của site, không phải của extension)

1. **Tìm kiếm hỏng trên chính site — extension KHÔNG có tìm kiếm.**
   `GET /tim-kiem/<từ-khóa>` trả trang lỗi "Trang lỗi hoặc không có kết
   quả tìm kiếm" với MỌI từ khóa đã thử (naruto, tenseigan, gay, bts,
   conan, xuyên-nhanh...), kể cả từ khóa site tự ghi trong "Tìm kiếm gần
   đây", cả khi có cookie phiên + Referer; POST `/` với `search_q` trả
   về trang chủ không lọc; không có endpoint AJAX/gợi ý nào trong JS của
   site (chỉ có redirect về `/tim-kiem/<kw>`). Cùng hỏng như vậy trên
   truyen247.pro (cùng mẫu). Theo create mode, `search.js` đã BỎ hẳn
   (không có file, không khai báo khóa `search` trong `plugin.json`).
   Hãy duyệt truyện bằng Trang chủ / Thể loại.
2. **Mục lục truyện rất dài có thể bị cắt.** Truyện 800 chương
   ([4] Tenseigan) chỉ liệt kê 200 chương mới nhất (601–800); nhưng
   truyện 249 chương (Cạm bẫy hôn nhân) hiện đủ 249 mục (247 chương +
   2 mục Thông báo/Giới thiệu truyện mới). Không có API hay trang phân
   trang nào lấy được chương cũ hơn (đã thử `?page=2`, `/trang-2/`,
   `/danh-sach-chuong/`, sitemap; nút prev ở chương đầu danh sách bị vô
   hiệu hoá). `detail.js` chỉ ghi chú "chỉ hiện ... chương mới nhất"
   khi tổng số chương site khai (JSON-LD `numberOfPages`) lớn hơn số
   link liệt kê. Truyện ≤ ~250 chương thì mục lục đầy đủ.
3. **Không có mirror.** truyen247.pro dùng cùng mẫu giao diện nhưng là
   kho truyện riêng, không phải mirror của aztruyen.top — chỉ là ứng
   viên port sau (cần kiểm chứng riêng 1 truyện + 1 chương trước khi
   port), không đưa vào danh sách mirror.
