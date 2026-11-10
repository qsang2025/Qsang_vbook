# SangtacvietApp — Extension vBook Tối Ưu Hóa Tốc Độ Cao

Extension **SangtacvietApp** được nghiên cứu và phát triển dựa trên việc dịch ngược (reverse-engineering) ứng dụng chính thức **Sáng Tác Việt Mobile Reader** (bản APK `com.sangtacviet.mobilereader` v1.2.15 trên nền tảng Capacitor) kết hợp đối chiếu với extension `sangtacviet` web hiện có trong repo `Qsang_vbook`.

---

## 1. Điểm nghẽn ở bản Web cũ & Giải pháp tối ưu đột phá

| Tiêu chí | Bản Web cũ (`sangtacviet`) | Bản App mới (`SangtacvietApp`) | Cải thiện |
|---|---|---|---|
| **Chi tiết truyện (`detail.js`)** | Tải toàn bộ mã HTML trang web (~200KB) kèm script, quảng cáo; dùng jsoup DOM selector và regex bóc tách. Dễ gặp Cloudflare challenge. | Khai thác API nội bộ của Mobile App: `/mobile/bookinfo.php?host={host}&hid={id}` trả JSON trực tiếp (<2KB). Hỗ trợ tách nhiều thể loại tag, nhận diện status số (`0`, `1`, `2`, `3`) và chữ (`Không xác định`/`Còn tiếp`/`Tạm ngưng`/`Hoàn thành`); `Tạm ngưng` ghi chú rõ trong detail thay vì nhầm là hoàn thành (khảo sát 10 truyện 2026-11-10) và nâng cấp ảnh bìa sang HTTPS (tránh bị Android chặn cleartext HTTP). Tự động fallback về HTML parser nếu cần. | **Nhanh gấp 10 lần**, tiết kiệm 99% băng thông, ảnh bìa hiển thị an toàn. |
| **Mục lục (`toc.js`)** | Referer tĩnh không khớp truyện gây rỗng ở một số host, không đảo ngược thứ tự chương nguồn `uukanshu`. | Header `Referer` gắn chính xác theo truyện (`/truyen/{host}/1/{bookid}/`). Phân tách chuỗi bằng `split("-/-")` bền bỉ và **tự động đảo ngược thứ tự chương cho host `uukanshu`** chuẩn theo logic của Mobile App gốc. | Mục lục không bị thiếu chương hay đảo ngược thứ tự đọc. |
| **Đọc chương (`chap.js`)** | Với **từng chương**, extension buộc phải bật một Headless WebView (`Engine.newBrowser()`), load HTML shell, nạp JS obfuscated của STV, chờ 2–5 giây để tính khóa `chapterkey`, rồi đóng WebView. | **Smart Key Caching**: Khóa `chapterkey` và cookie `readcontextid` của STV có hiệu lực cho toàn bộ các chương của cùng một đầu truyện. Khóa được lưu vào `cacheStorage` / `localStorage`. Khi chuyển chương 2, 3, 4..., extension đọc thẳng nội dung với key đã lưu. | **Chuyển chương tức thì (~150ms)**, loại bỏ hoàn toàn độ trễ 2–5s khởi động WebView của các chương tiếp theo. |
| **Quản lý khóa & Tự phục hồi** | Nếu WebView lỗi hoặc server trả mã 7/10002 thì thất bại ngay. | Tự động kiểm tra: nếu dùng key cũ bị hết hạn/lỗi, extension tự động xóa cache, xin cấp grant mới và thử lại liền mạch. Key chỉ đọc từ `window.app.reader.chapterkey` (không dùng giá trị trả về của `eval()` — mã grant trả `undefined`, chứng minh bằng phân tích APK 10/11); key chỉ được cache **sau khi** đọc chương thành công lần đầu. Server STV trả mã `0` là thành công (chứng minh từ code site `stv.ui.js`), mã `1` giữ làm dự phòng. | Ổn định và bền bỉ hơn. |
| **Lọc rác & Định dạng** | Thay thế regex cơ bản. | Áp dụng đầy đủ quy tắc `app.reader.preprocess` của STV Mobile theo từng host: lọc quảng cáo uukanshu (`ad_content`), sửa lỗi dấu ngoặc kép faloo, sửa ảnh fanqie (`_i_` -> `~`, `https:`), loại bỏ `\ufffe` và thẻ `<a>` rác. | Trình bày chuẩn mắt đọc. |
| **Header định danh** | Dùng header web hỗn hợp. | Gửi đầy đủ headers của app di động: `x-stv-transport: app`, `x-requested-with: com.sangtacviet.mobilereader`, `Cookie: mac_tt=true;`. | Server nhận diện là app chính thức. |

---

## 2. Danh sách file trong `src/`

- `config.js`: Cấu hình `BASE_URL` mặc định (`https://sangtacviet.app`), danh sách mirror (`.vip`, `.com`, `.pro`) — từ v4 chỉ failover khi lỗi mạng, đã nhận HTTP response thì trả ngay (I3); mỗi request qua `pacedFetch()` (`src/rate-limit.js`, copy từ `lib/`) chống chặn 405/429 + cooldown 60 phút (I4) — bộ nhớ đệm `getStoredKey` / `setStoredKey` / `clearStoredKey`.
- `detail.js`: Tải thông tin chi tiết qua `/mobile/bookinfo.php` (JSON), có fallback bóc tách HTML.
- `toc.js`: Tải danh sách chương qua `/index.php?ngmar=chapterlist&h={host}&bookid={id}&sajax=getchapterlist`.
- `chap.js`: Tải nội dung chương với cơ chế Smart Key Caching, giải mã grant trong WebView khi cần và làm sạch văn bản theo chuẩn App.
- `search.js`: Tìm kiếm truyện qua API `/io/searchtp/searchBooks`.
- `gen.js`: Danh sách truyện theo phân loại/sắp xếp (`sort=update`, `sort=view`, `sort=auto`...).
- `home.js`: Trả danh sách tab tĩnh trang chủ (Mới cập nhật, Lượt đọc tổng, Tuần, Ngày, Đề cử, Lượt thích, Theo dõi).
- `genre.js`: Danh mục thể loại (Huyền huyễn, Đô thị, Võng du, Khoa huyễn...).
- `helper.js`: Hàm bóc tách danh sách truyện chung cho `search.js` và `gen.js`.
- `comment.js`: Đọc bình luận truyện từ API nội bộ `/mobile/comment.php?act=readcomment`, hiển thị nickname, danh hiệu tu vi, avatar, thời gian và câu trả lời kèm theo (reply).
- `crypto.js`: Thư viện tính MD5 chữ ký `x-stv-sign` (đồng bộ từ `lib/crypto.js`).
- `challenge-handler.js`: Xử lý cảnh báo xác minh Cloudflare và yêu cầu đăng nhập (đồng bộ từ `lib/challenge-handler.js`).

---

## 3. Quy chuẩn kỹ thuật (AGENTS.md)

- Tuân thủ nghiêm ngặt chuẩn cú pháp **Rhino ES6** (`var`, `function`, không dùng arrow function, async/await, template literal...).
- Tác giả: `"author": "MuseAi"`.
- Đóng gói và kiểm tra tự động qua CLI:
  ```bash
  node scripts/cli.js build extensions/novel/sangtacvietapp
  node scripts/cli.js build-catalog
  node scripts/cli.js validate
  ```
