# Truyen247 — truyen247.pro

Extension đọc truyện chữ tiếng Việt miễn phí trên truyen247.pro
(fanfiction, ngôn tình, đam mỹ, truyện teen...). Tác giả: MuseAi.

Copy từ mẫu AzTruyen v2 (cùng giao diện — site này từng tên là
AZTruyen.TOP; hai site là kho truyện RIÊNG, không phải mirror của nhau).

## Khảo sát site (live 2026-11-12, từ VM)

- Trang chủ HTTP 200 (248.751 byte). HTML tĩnh, không Cloudflare.
- **28 thể loại duy nhất** theo slug (trang chủ có 33 link `/the-loai/`
  nhưng 5 link lặp lại dạng tương đối; trang `/the-loai/` tự nó trả
  trang lỗi nên genre phải đọc từ trang chủ như AzTruyen): Bí Ẩn,
  ChickLit, Cổ Điển, Đam Mỹ, Đô Thị, Fan Fiction, Hài Hước, Hành Động,
  Hư Cấu, Kinh Dị, Lãng Mạn, LGBT, Lịch Sử, Ma Cà Rồng, Ngẫu Nhiên,
  Ngôn Tình, Người Sói, Phi Tiểu Thuyết, Phiêu Lưu, Siêu Nhiên,
  Tâm Linh, Thơ Ca, Thriller, Tiểu Thuyết, Truyện Ngắn, Truyện Teen,
  Viễn Tưởng, Xuyên Không.
- Trang chủ có 2 mục `div.row.storylist` (mỗi mục 12 truyện, không
  phân trang, không có tiêu đề riêng trên site): tab 0 = "Top Truyện
  Hay", tab 1 = "Mới cập nhật" (tên tab do extension đặt).
- Trang thể loại `/the-loai/<slug>/` 20 truyện/trang, phân trang
  `?page=N` (đã kiểm chứng `/the-loai/fanfiction/` = 20 truyện, có
  `?page=2`).
- Truyện mẫu: "Đại Boss Hắc Đạo Và Vợ Yêu Chủ Tịch Lạnh Lùng"
  (`/dai-boss-hac-dao-va-vo-yeu-chu-tich-lanh-lung-141882581/`) —
  Hoàn thành, 106 chương, thể loại Lãng Mạn, uploader kimquyenngo.
  Mô tả không có dòng "Tác giả:" nên tác giả lấy từ
  `a[itemprop=author]` = kimquyenngo; mô tả không có dòng "Tình
  Trạng:" nên trạng thái lấy từ `p.story_completed` = "Hoàn thành".
  JSON-LD `numberOfPages` = 106. Mục lục có 2 `ul.chapters`: ul 1 =
  5 chương mới nhất (102–106), ul 2 = đủ 106 chương (ch.1 "Nữ chủ
  tịch lạnh lùng" → ch.106 "Ngoại truyện 9: Đầy tháng Lăng Tâm
  Nhiên"). Bìa cùng domain: `https://truyen247.pro/images/<slug>.webp`.
- Chương 1 (`/chuong-1-nu-chu-tich-lanh-lung-549072183/`): tiêu đề
  `h2.chapter-title` = "Chương 1: Nữ chủ tịch lạnh lùng", nội dung
  `div.chapter-content` = 26 đoạn `<p>`, 3.955 ký tự, mở đầu "Lãnh
  thị là một tập đoàn đa ngành xuyên quốc gia".

## Vòng đời

| Script | Cách hoạt động |
|---|---|
| `home.js` | 2 tab tĩnh: Top Truyện Hay (`/#top`), Mới cập nhật (`/#moi`). |
| `genre.js` | 28 thể loại, đọc từ menu trang chủ, gom theo slug. |
| `book.js` | Renderer chung: hàng truyện `div.col-sm-12.col-md-6.story` (bìa `img[data-src]`, tiêu đề `h2 a`, mô tả `p.crop-text-2.desc`); trang thể loại 20 truyện/trang, phân trang `?page=N` (nút `›`). |
| `detail.js` | Tên `h1.title`, bìa `og:image`, tác giả thật từ dòng đầu mô tả (`Tác Giả: ...`, dự phòng người đăng `a[itemprop=author]`), thể loại `p.story_categories a[itemprop=genre]`, trạng thái từ dòng `Tình Trạng:` trong mô tả (dự phòng `p.story_completed`), số chương = số link chương thật trong `#chapters` (dedupe theo link, bỏ 2 mục Thông báo/Giới thiệu truyện mới). |
| `toc.js` | Chỉ lấy `ul.chapters` thứ 2 trong `div#chapters` ("Danh sách chương", toàn bộ chương theo đúng thứ tự đọc), giữ nguyên thứ tự DOM, dedupe theo link (key = chapterId = cụm số cuối URL). KHÔNG sắp xếp/dedupe theo số chương N — truyện nhiều quyển đánh số lại theo quyển (vd trên aztruyen.top: Q.1 - Chương 63 và Q.2 - Chương 63 cùng tồn tại trong "Cạm bẫy hôn nhân"). |
| `chap.js` | Nội dung `.chapter-content`, tiêu đề `h2.chapter-title`. |
| `search.js` | KHÔNG CÓ (xem dưới đây). |

## Giới hạn đã biết (của site, không phải của extension)

1. **Tìm kiếm hỏng trên chính site — extension KHÔNG có tìm kiếm.**
   `GET /tim-kiem/?tukhoa=ma` trả trang lỗi "Trang lỗi hoặc không tồn
   tại! Vui lòng thử lại..." với 0 link truyện (kiểm chứng live
   2026-11-12); trang `/the-loai/` cũng trả trang lỗi. Cùng hỏng như
   aztruyen.top (cùng mẫu). Theo create mode, `search.js` đã BỎ hẳn
   (không có file, không khai báo khóa `search` trong `plugin.json`).
   Hãy duyệt truyện bằng Trang chủ / Thể loại.
2. **Mục lục truyện rất dài có thể bị cắt.** Trên aztruyen.top, truyện
   800 chương chỉ liệt kê 200 chương mới nhất (601–800). Trên
   truyen247.pro giới hạn này CHƯA kiểm chứng lại (không tìm thấy
   truyện >200 chương lúc khảo sát) — cùng mẫu nên giả định cùng giới
   hạn. `detail.js` chỉ ghi chú "chỉ hiện ... chương mới nhất" khi
   tổng số chương site khai (JSON-LD `numberOfPages`) lớn hơn số link
   liệt kê.
3. **Không có mirror.** aztruyen.top dùng cùng mẫu giao diện nhưng là
   kho truyện riêng, không phải mirror của truyen247.pro.

## Kết quả test

- `validate`: **PASS — 31 nguồn, 0 cảnh báo** (2026-11-12).
- Test trên máy thật (HONOR PTP-AN10, dev server 100.90.26.91:8080,
  2026-11-12 09:57 UTC — log `work/ext-review/truyen247-device-test.log`):
  **8/8 case code 0**:
  - `home.js`: 2 tab (Top Truyện Hay / Mới cập nhật).
  - `genre.js`: 28 thể loại (có Fan Fiction, Ngôn Tình, Đam Mỹ).
  - `book.js /the-loai/fanfiction`: 20 truyện, `data2` trỏ `?page=2`.
  - `book.js /#top`: 12 truyện; `book.js /#moi`: 12 truyện.
  - `detail.js`: tên đúng, tác giả kimquyenngo (người đăng, do mô tả
    không có dòng "Tác giả:"), "Trạng thái: Hoàn thành • Số chương: 106",
    `ongoing: false`, bìa `.../images/<slug>.webp`.
  - `toc.js`: 106 chương, ch.1 "Nữ chủ tịch lạnh lùng" → ch.106
    "Ngoại truyện 9: Đầy tháng Lăng Tâm Nhiên", đúng thứ tự đọc.
  - `chap.js`: ch.1, 26 đoạn `<p>`, ~4.000 ký tự, mở đầu "Lãnh thị là
    một tập đoàn đa ngành xuyên quốc gia".
- Cài lên máy: `[install] OK code=200` (2026-11-12 09:57 UTC).
- Chưa merge lên main — chờ Anh test trong app và nói merge.
