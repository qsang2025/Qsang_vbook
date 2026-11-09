# Extension Tiệm Truyện Chữ (vBook)

Extension đọc truyện chữ từ **Tiệm Truyện Chữ** (`https://tiemtruyenchu.cloud`).

## Bản gộp duy nhất (v5)
Từ v5, đây là extension **duy nhất** cho Tiệm Truyện Chữ trong repo — gộp từ 2 bản cũ: `Tiệm Truyện Chữ` v6 (bản chính, có đăng nhập + Mobile API) và `TiemtruyenchuVIP` v4 (tự mở khóa từ nguồn Trung). Bản chính cũ đã xóa khỏi registry; sách đã thêm dưới nguồn cũ vẫn đọc được bằng bản đã cài trên máy cho tới khi gỡ nguồn đó trong app, sách mới thêm dưới bản gộp này ("TiemtruyenchuVIP").

**Không còn đăng nhập tự động.** Bản gộp không có tài khoản/mật khẩu/OTP (bỏ từ v5 theo quyết định 2026-11-09): tài khoản bắt buộc OTP thì mỗi lần token hết hạn extension tự đăng nhập lại sẽ làm server gửi email OTP mới, dễ bị Google/TTC khóa tài khoản, mà tài khoản đó không sở hữu chương VIP nào nên đăng nhập cũng không mở thêm được gì. Cách đọc chương:
- **Chương miễn phí:** qua API prefetch + cookie phiên (đăng nhập bằng trình duyệt trong app rồi để extension đồng bộ cookie, hoặc dán cookie vào `COOKIE`).
- **Chương VIP đã mua (có token):** qua Mobile API — extension lấy meta chương để có `vipToken` rồi gọi `POST /api/v1/chapters/content` kèm `vipToken`, trả tiếng Việt của TTC.
- **Chương VIP chưa mua:** tự lấy truyện gốc tiếng Trung từ ixdzs8.com, hiển thị nguyên văn (không dịch máy) — xem mục v3 dưới.

## Token (TOKEN) — dán tay, tùy chọn
`TOKEN` là **JWT (access token) của app Tiệm Truyện Chữ**, chỉ dùng cho tuyến Mobile API ở trên. Extension không tự lấy token (không có đăng nhập); token lấy ở đâu:
- Token từng lưu bởi bản chính cũ còn nằm trong `localStorage` trên máy (`ttc_jwt`, từ lần đăng nhập OTP 2026-11-08) — extension tự đọc nếu còn hạn, không cần dán lại.
- Hết hạn thì đăng nhập lại bằng trình duyệt trong app rồi dán token mới vào mục `TOKEN` trong Cài đặt nguồn (hoặc để trống — chương free vẫn đọc qua cookie, chương VIP chưa mua vẫn lấy tiếng Trung).
- Không dán token thì tuyến Mobile API bỏ qua, các tuyến còn lại vẫn chạy bình thường.

## Tính năng
- Khai thác trực tiếp hệ thống **Public JSON API v1** (`/api/v1/stories`, `/api/v1/ranking`, `/api/v1/stories/<id>`) tốc độ cao, không cần đăng nhập cho toàn bộ:
  - Danh sách trang chủ (Mới cập nhật, Truyện mới, Truyện Full, Xem nhiều, Truyện Nam/Nữ, 5 Bảng xếp hạng).
  - 19 thể loại truyện đầy đủ.
  - Tìm kiếm theo từ khóa và xem thông tin chi tiết truyện.
  - Tự động lấy danh sách chương với tiêu đề thật từ mảng `chapters` ở top-level của API chi tiết (`/api/v1/stories/<id>`, mỗi item có `chapterNumber` + `title`), hoặc trích xuất tiêu đề chương đầy đủ từ DOM khi đã có phiên đăng nhập.
- Chỉ dùng tên miền `https://tiemtruyenchu.cloud`. Tên miền cũ `tiemtruyenchu.com` đã ngừng hoạt động (trang thông báo tạm ngừng); các link cũ lưu dưới `.com` được chuẩn hoá về `.cloud` khi xử lý.
- Hỗ trợ đọc nội dung chương qua API đọc nhanh (`/api/prefetch-chapter`), Cookie cấu hình (`COOKIE`) và tự động đồng bộ phiên đăng nhập từ trình duyệt tích hợp của vBook (`Engine.newBrowser()`). Chip thể loại ở trang chi tiết gửi slug thể loại (`cat=huyen-huyen`), không gửi tên hiển thị.

## Hướng dẫn đọc nội dung chương
Trang nguồn `tiemtruyenchu.cloud` yêu cầu tài khoản đăng nhập khi đọc nội dung chương:
1. Mở **Trình duyệt** tích hợp trong ứng dụng vBook, truy cập `https://tiemtruyenchu.cloud/login` và đăng nhập tài khoản. Extension sẽ tự động lấy và lưu phiên đăng nhập khi mở chương.
2. Hoặc dán giá trị Cookie phiên (`connect.sid=...`) vào mục **Cài đặt nguồn** (`COOKIE`) của extension (lưu ý: không bao giờ nhập mật khẩu trực tiếp vào cài đặt plugin).
3. Chương VIP đã mua cần token (xem mục Token ở trên); chương VIP chưa mua thì extension tự lấy tiếng Trung gốc (mục v3 dưới). Công tắc `AUTO_UNLOCK` trong Cài đặt nguồn bật/tắt tuyến tự mở khóa (mặc định bật).

## Mục lục đánh dấu chương VIP (v5)
Mục lục đánh dấu chương có giá (`chapter_price` > 0) bằng `lock` + `pay` ("VIP · N hoa") để nhìn là biết chương nào sẽ trả tiếng Trung qua tuyến tự mở khóa. Không có đăng nhập nên extension không biết chương nào tài khoản đã mua (trường `isPurchased` chỉ có khi đăng nhập) — chỉ đánh dấu theo giá.

## Chương VIP — nguyên văn tiếng Trung (v3)
Khi chương VIP không đọc được qua API của Tiệm Truyện Chữ (chưa đăng nhập tài khoản VIP), extension tự động lấy truyện gốc tiếng Trung từ ixdzs8.com và **hiển thị nguyên văn tiếng Trung, không dịch máy** — người đọc tự dịch cho chuẩn. Chương đọc được qua API chính thức vẫn hiển thị bản dịch tiếng Việt của Tiệm Truyện Chữ như bình thường.

Bảng map ở `chap.js` giờ chỉ còn đúng 1 truyện tên thuần Việt không chuyển được (Cái Trò Chơi Này Không Thích Hợp...); Quỷ Bí Chi Chủ và Bắt Đầu Trường Sinh... đã bỏ khỏi map từ v5 để đường tự tìm theo tên Hán-Việt được kiểm chứng thường xuyên (đã kiểm chứng live: 诡秘之主 → 646492, 长生万古苟到天荒地老 → 492266). Số chương đối chiếu theo số hiển thị trong tiêu đề TTC ("Chương 1462: Niết Bàn") và kiểm chứng bằng tiêu đề thật `<h1>` trên trang Trung, vì số trang bên đó lệch với số chương (Quỷ Bí Chi Chủ lệch +1, Bắt Đầu Trường Sinh lệch +16); không khớp được thì báo lỗi chứ không trả nhầm chương.

## Tự tìm truyện gốc theo tên Hán-Việt (v4)
Từ v4, extension tự đổi tên truyện tiếng Việt sang tên gốc tiếng Trung bằng bảng Hán-Việt trong `src/hanviet.js` (mỗi âm tiết ứng với một chữ Hán, vd. Quỷ Bí Chi Chủ = 诡秘之主), rồi tìm trên ixdzs8.com và đối chiếu tên thật trả về để khỏi lấy nhầm truyện — đọc truyện mới không cần ghi sẵn vào bảng map nữa. Âm đa nghĩa (vd. Kỳ = 奇/棋) thì thử lần lượt các biến thể; tên thuần Việt không đổi được (vd. Cái Trò Chơi Này Không Thích Hợp...) vẫn dùng bảng map ghi sẵn. Kết quả tìm được lưu lại trên máy (localStorage) nên lần sau mở chương cùng truyện không cần tìm lại. Không dùng Google Dịch cho tên truyện (đã kiểm chứng: dịch theo nghĩa nên sai hết).

## Attribution
- Tham khảo cấu trúc API `/api/v1/*` và cơ chế lấy phiên trình duyệt từ `ext_Ivan1hai` (`ivanzzz`).
- Tham khảo bộ chọn HTML DOM từ `vbook-extension_sonzin` (`sonzin`) và `vbook-ext_Evamirion` (`Vearn`).
