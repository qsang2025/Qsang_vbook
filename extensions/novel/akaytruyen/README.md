# AkayTruyen — akaytruyen.com

Extension đọc truyện chữ tiếng Việt trên akaytruyen.com (site của tác giả
AkayHau và các tác giả khác). Port từ AkayTruyen v3 của Ivan1hai (fork trên
đĩa, đọc được, không mã hóa), viết lại hoàn toàn theo hợp đồng hiện tại —
base dùng `let`/arrow function và fetch không pacing, chỉ tham khảo
endpoint + selector. Base longvuu v19 thì mã hóa, không dùng được làm code.

## Site (khảo sát live 2026-11-13)

- Laravel SSR, HTML tĩnh phía server; không Cloudflare, không cổng xác minh
  mã, không cần xoay User-Agent.
- 23 thể loại (`/the-loai/<slug>`); trang thể loại hiện 16 truyện và **không
  phân trang** (`?page=2` trả giống hệt trang 1) nên `gen.js` luôn trả
  `data2 = ""`.
- Các mục trang chủ (Truyện Hot / Truyện Mới / Truyện hoàn thành) không có
  URL danh sách riêng (`/truyen-moi`, `/truyen-hot`, `/truyen-full` đều 404)
  nên `home.js` chỉ trả tab tĩnh: Trang chủ (`/`) + 4 thể loại phổ biến.
- Tìm kiếm: GET `/tim-kiem?key_word=<từ khóa>` — **chỉ trả kết quả khi gõ có
  dấu** (vd "con đường" trả 1, "con duong" trả 0); kết quả dùng thẻ
  `.story-item-list`.
- Chi tiết: `/truyen/<slug>`; tác giả / trạng thái / thể loại ở
  `.story-detail__bottom--info`; mô tả ở `.story-detail__top--desc`; bìa ở
  `.story-detail__top--image img` (`/storage/media-variants/...webp`).
- Mục lục: 50 chương/trang, mặc định mới nhất trước; `?old_first=1` đổi sang
  cũ nhất trước; phân trang `?old_first=1&page=N`, số trang lớn nhất ở
  `#main-chapter-pagination` (Con Đường Bá Chủ: 76 trang / 3.752 chương;
  Thiên La: 11 trang / 501 chương).
- Chương có **3 dạng URL**: `/<slug>/chuong-<N>-<tên>` (Con Đường Bá Chủ),
  `/<slug>/<N>-chuong-<N>-<tên>` (Thiên La ch.1–43) và `/<slug>/<N>-<tên>`
  (Thiên La ch.44–50, Con Đường Bá Chủ ch.8–10...); có cả chương đặc biệt
  không có số trong URL (ch.16 Con Đường Bá Chủ:
  `.../nhan-cach-dang-tran-trong`) — số chương chuẩn lấy từ thuộc tính
  `data-chapter` của thẻ chương, và tên chương cắt bỏ tiền tố "Chương N:"
  nếu thẻ `.chapter-title` tự mang (Thiên La); nội dung ở
  `div#chapter-content`, các thẻ `<p>` sạch.
- **Nội dung chương đọc ĐỦ, không cần đăng nhập, đúng truyện gốc** — đã đối
  chiếu ch.1 của cả 2 truyện mẫu (Con Đường Bá Chủ 58 đoạn, Thiên La 184
  đoạn); không phải văn bản ghép như cgsdlx, không phải bản xem trước như
  medoctruyen, không yêu cầu đăng nhập như comnguoinovel.

## Truyện mẫu (test.json)

- Con Đường Bá Chủ — Akay, Full, 3.752 chương; ch.1 "Nam vừa mới tỉnh giấc..."
- Thiên La — Thiên Trường Địa Cửu, Đang ra, 501 chương; ch.1 "Bên ngoài phong
  linh của Thương Vân Thành, Lâm Phong..."

## Điểm còn mở

- Bìa `storage/media-variants/...webp` chưa kiểm chứng hiển thị trong app.
- Chỉ test 1 thể loại (Tiên Hiệp) và 2 truyện mẫu trên máy; các thể loại khác
  chỉ kiểm chứng HTTP 200 / code 0 từ VM.
- Tìm kiếm không dấu trả 0 kết quả là hành vi của site, không phải lỗi
  extension (ghi rõ trong description của plugin.json).
