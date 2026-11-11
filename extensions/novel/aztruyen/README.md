# AzTruyen — aztruyen.top

Extension đọc truyện chữ tiếng Việt miễn phí trên aztruyen.top
(fanfiction, ngôn tình, đam mỹ, truyện teen...). Tác giả: MuseAi.

## Vòng đời

| Script | Cách hoạt động (kiểm chứng live 2026-11-11) |
|---|---|
| `home.js` | 2 tab tĩnh: Top Truyện Hay (`/#top`), Mới cập nhật (`/#moi`) — trang chủ có 2 mục, mỗi mục 12 truyện, không phân trang. |
| `genre.js` | 28 thể loại, đọc từ menu trang chủ, gom theo slug. |
| `book.js` | Renderer chung: hàng truyện `div.col-sm-12.col-md-6.story` (bìa `img[data-src]`, tiêu đề `h2 a`, mô tả `p.crop-text-2.desc`); trang thể loại 20 truyện/trang, phân trang `?page=N` (nút `›`). |
| `detail.js` | Tên `h1.title`, bìa `og:image`, tác giả thật từ dòng đầu mô tả (`Tác giả: ...`, dự phòng người đăng `a[itemprop=author]`), thể loại `p.story_categories a[itemprop=genre]`, trạng thái `p.story_completed` (Hoàn thành / Đang cập nhật). |
| `toc.js` | `div#chapters ul.chapters li.listc a`. URL chương dạng `/chuong-N-<tiêu-đề>-<id>/` hoặc `/part-N-<id>/`. |
| `chap.js` | Nội dung `.chapter-content`, tiêu đề `h2.chapter-title`. |
| `search.js` | Xem dưới đây. |

## Giới hạn đã biết (của site, không phải của extension)

1. **Tìm kiếm hỏng trên chính site.** `GET /tim-kiem/<từ-khóa>` trả trang
   lỗi "Trang lỗi hoặc không có kết quả tìm kiếm" với MỌI từ khóa đã thử
   (naruto, tenseigan, gay, bts, conan, xuyên-nhanh...), kể cả từ khóa site
   tự ghi trong "Tìm kiếm gần đây", cả khi có cookie phiên + Referer; POST
   `/` với `search_q` trả về trang chủ không lọc; không có endpoint
   AJAX/gợi ý nào trong JS của site (chỉ có redirect về `/tim-kiem/<kw>`).
   Cùng hỏng như vậy trên truyen247.pro (cùng mẫu). Vì vậy `search.js`
   trả `Response.error` tiếng Việt rõ ràng thay vì trả danh sách rỗng gây
   hiểu lầm. Hãy duyệt truyện bằng Trang chủ / Thể loại.
2. **Mục lục tối đa 200 chương mới nhất.** Trang chi tiết chỉ liệt kê 200
   chương mới nhất (truyện 800 chương chỉ hiện 601–800); không có API hay
   trang phân trang nào lấy được chương cũ hơn (đã thử `?page=2`,
   `/trang-2/`, `/danh-sach-chuong/`, sitemap; nút prev ở chương đầu danh
   sách bị vô hiệu hoá). Truyện ≤ 200 chương thì mục lục đầy đủ.
3. **Không có mirror.** truyen247.pro dùng cùng mẫu giao diện nhưng là kho
   truyện riêng, không phải mirror của aztruyen.top.
