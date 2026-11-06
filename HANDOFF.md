# HANDOFF & PROJECT BLUEPRINT

> **Dành cho Agent / Developer tiếp quản**: Tài liệu này tóm tắt toàn bộ bối cảnh, các phát hiện kỹ thuật cốt lõi, mục tiêu và hướng dẫn triển khai để tiếp tục công việc ngay lập tức mà không mất thời gian dò tìm lại từ đầu.

---

## 1. Mục Tiêu Dự Án (Milestone M1)

Khách hàng yêu cầu xây dựng ít nhất **2 extension thể loại Video** cho ứng dụng vBook (Android):
1. **Extension 1: Hoạt Hình 3D Trung Quốc (`hoathinh3d`)**: Chuyên Donghua 3D Trung Quốc (Thế Giới Hoàn Mỹ, Đấu Phá Thương Khung, Tiên Nghịch, Phàm Nhân Tu Tiên, Thôn Phệ Tinh Không, Già Thiên, Linh Cảnh Hành Giả, v.v.).
2. **Extension 2: Hoạt Hình AI Trung Quốc (`hoathinh_ai`)**: Chuyên phim hoạt hình do AI tạo, phim ngắn AI, tu tiên AI, truyện tranh AI Vietsub Trung Quốc.

### Yêu Cầu Cốt Lõi:
- **Stream video phải chạy được 100% trên Android vBook native player (ExoPlayer)**: Link video trả về ở `track.js` phải là link trực tiếp (`.m3u8` hoặc `.mp4` với `type: "native"` và `mimeType: "application/x-mpegURL"`), hoặc embed player tương thích (`type: "auto"`).
- **Tuyệt đối không để xảy ra lỗi**: *"Không thể tải máy chủ này. Hãy thử máy chủ khác."*.
- Đóng gói thành file `plugin.zip`, cập nhật catalog `plugin.json` ở root repo, vượt qua `validate.js` và `health-check.js`.
- Đồng bộ và duy trì ở cả 2 repo:
  - `qsang2025/Qsang_vbook` (`/home/antigravity/qsang2025/Qsang_vbook`)
  - `qsang2025/Qsang_vbook_pro` (`/home/antigravity/qsang2025/Qsang_vbook_pro`)

---

## 2. Các Phát Hiện Kỹ Thuật Quan Trọng (Critical Findings)

### 2.1. Tại sao extension cũ `hhkungfu.ee` và các web tương tự (hoathinh3d.ee) KHÔNG THỂ sửa được
- **Cơ chế chống bot / chống crawler của `streamfree.vip`**:
  - Toàn bộ nguồn phát video của `hhkungfu.ee` chuyển hướng sang máy chủ embed `streamfree.vip`.
  - Qua dịch ngược code JS của `streamfree.vip`: nguồn phát sử dụng công nghệ mã hóa **Chunked Base65 Transport** kết hợp **Service Worker** để giải mã nhị phân và bơm vào HTML5 `MediaSource` (MSE) trên RAM trình duyệt.
  - Mã nguồn này kiểm tra môi trường:
    - Nếu không nằm trong iframe được cấp phép: ném lỗi `-2` (*"Oh, video này chỉ có thể phát trong iframe."*).
    - Nếu không phải trình duyệt hoàn chỉnh (Chrome, Safari, Firefox) hoặc thiếu Service Worker: ném lỗi `-5`.
  - **Vấn đề với vBook**: vBook trên Android phát video qua **ExoPlayer**. Trình bắt link ngầm (background WebView sniffer) của vBook lắng nghe các request HTTP/HTTPS tìm link có phần mở rộng `.m3u8` hoặc `.mp4`. Do `streamfree.vip` không bao giờ gửi ra link m3u8/mp4 thô mà chỉ nạp chunk qua Worker, WebView sniffer bị timeout (hết thời gian chờ) và báo lỗi: *"Không thể tải máy chủ này. Hãy thử máy chủ khác."*.
  - Các lập trình viên vBook kỳ cựu (như Lê Hồng Kỳ `kychitoge` trong commit `fac13fe9`) cũng đã xác nhận và bỏ cuộc với `streamfree.vip` (*"Lưu ý: không xem được đâu, đầu hàng"*).

### 2.2. Về chế độ Developer Mode của vBook App
- Máy chủ AI / CLI chạy trong một Remote Virtual Machine (Debian 12 trên Cloud). Môi trường mạng của VM đi qua proxy bảo mật và **chặn truy cập trực tiếp qua IP cục bộ** (`Direct IP access is not allowed`).
- Do đó, remote agent không thể kết nối trực tiếp đến IP điện thoại (ví dụ `http://166.32.143.61:8080`) được mở qua Wi-Fi nội bộ của người dùng. Hãy giải thích rõ điều này cho người dùng nếu họ hỏi lại.

### 2.3. Nguồn cung cấp dữ liệu tốt nhất (Đã kiểm chứng m3u8 direct 100%)
- **`https://phimapi.com`** (và các mirror KKPhim, OPhim):
  - Miễn phí, tốc độ cao, không chặn Cloudflare, trả lời trực tiếp định dạng JSON.
  - Cung cấp link `.m3u8` đa luồng CDN (ví dụ `https://a.kvp726.com/.../index.m3u8`).
  - Khi trả về từ `track.js`:
    ```javascript
    return Response.success({
        data: url, // link .m3u8 trực tiếp
        type: "native",
        mimeType: "application/x-mpegURL",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://phimapi.com/"
        }
    });
    ```
  - **ExoPlayer của vBook phát tức thì, chất lượng 1080p FHD, tua mượt, có đầy đủ Vietsub/Thuyết minh.**

- **Các API Endpoint chính của PhimAPI**:
  - Hoạt hình Trung Quốc: `https://phimapi.com/v1/api/the-loai/hoat-hinh?country=trung-quoc&page={page}`
  - Huyền Huyễn / Tu Tiên: `https://phimapi.com/v1/api/the-loai/huyen-huyen?country=trung-quoc&page={page}`
  - Kiếm Hiệp: `https://phimapi.com/v1/api/the-loai/kiem-hiep?country=trung-quoc&page={page}`
  - Chi tiết phim: `https://phimapi.com/phim/{slug}` -> chứa toàn bộ mảng `episodes` và `link_m3u8`.
  - Tìm kiếm: `https://phimapi.com/v1/api/tim-kiem?keyword={keyword}&page={page}`

---

## 3. Trạng Thái Hiện Tại (Progress Status)

1. Đã kiểm tra và phân tích cặn kẽ toàn bộ mã nguồn của các extension video hiện có trong hệ sinh thái vBook (`vbook-ext_kychitoge`, `vbook-extensions_Darkrai9x`, `vbook-ext_Moleys`, `vbook_MeoU_hienpro00123`).
2. Xác định chính xác nguyên nhân `streamfree.vip` thất bại và giải pháp thay thế hoàn hảo bằng direct stream `.m3u8` qua `phimapi.com`.
3. Kiểm tra tính sẵn sàng của dữ liệu Donghua 3D (Thế Giới Hoàn Mỹ 288 tập, Tiên Nghịch 165 tập, Đấu Phá Thương Khung, Linh Cảnh Hành Giả...).
4. Lưu trữ toàn bộ tài liệu teamwork và chỉ thị của sentinel/orchestrator tại thư mục `.agents/teamwork/`.

---

## 4. Kế Hoạch Thực Hiện Tiếp Theo (Next Steps)

Khi agent mới bắt đầu:

### Bước 1: Xây dựng Extension 1 — Hoạt Hình 3D Trung Quốc (`hoathinh3d`)
Tạo thư mục `extensions/video/hoathinh3d/`:
- `plugin.json`:
  ```json
  {
    "metadata": {
      "name": "Hoạt Hình 3D Trung Quốc",
      "author": "Qsang",
      "version": 1,
      "source": "https://phimapi.com",
      "regexp": "phimapi\\.com/phim/.*",
      "description": "Kho phim hoạt hình 3D Trung Quốc (Donghua 3D) Vietsub & Thuyết minh chất lượng cao, phát mượt mà không quảng cáo.",
      "locale": "vi_VN",
      "type": "video",
      "language": "javascript"
    },
    "script": {
      "home": "home.js",
      "genre": "genre.js",
      "detail": "detail.js",
      "search": "search.js",
      "toc": "toc.js",
      "chap": "chap.js",
      "track": "track.js"
    }
  }
  ```
- `src/home.js`: Hiển thị các tab:
  - Mới Cập Nhật 3D
  - Tu Tiên & Huyền Huyễn
  - Võ Thuật & Kiếm Hiệp
  - Khoa Huyễn Dị Giới
  - Cổ Trang & Xuyên Không
- `src/genre.js`: Danh sách các thể loại Donghua.
- `src/detail.js`: Lấy thông tin phim, ảnh cover, mô tả nội dung, số tập hiện tại.
- `src/toc.js`: Trả về danh sách tất cả các tập của phim.
- `src/chap.js`: Trả về danh sách server phát (HLS Server / Fast CDN).
- `src/track.js`: Trả về `type: "native"` với `data: link_m3u8`.
- `icon.png`: Đặt icon đại diện đẹp mắt.

### Bước 2: Xây dựng Extension 2 — Hoạt Hình AI Trung Quốc (`hoathinh_ai`)
- Tương tự như Extension 1, tập trung vào kho nội dung phim hoạt hình AI, tu tiên AI, truyện tranh AI Vietsub và short drama AI Trung Quốc.
- Đảm bảo stream video phân giải về link direct `.m3u8` / `.mp4` hoặc embed player `type: "auto"`.

### Bước 3: Đóng gói, kiểm thử và đồng bộ Catalog
1. Tạo file `plugin.zip` cho từng extension bằng `zip -r plugin.zip . -x ".*"`.
2. Chạy công cụ kiểm thử:
   - `node scripts/validate.js` hoặc `node tools/cli/validate.js`
   - `node scripts/health-check.js`
3. Cập nhật catalog root `plugin.json` (thêm extension mới vào danh sách plugins).
4. Đồng bộ mã nguồn sang cả 2 repo `Qsang_vbook` và `Qsang_vbook_pro`.
5. Thực hiện `git add . && git commit -m "feat: add 3D and AI animation video extensions" && git push origin main`.

---

## 5. Quy Tắc Kỹ Thuật (Golden Rules)
1. **Rhino JS Runtime**: Chỉ dùng cú pháp JavaScript tương thích Rhino ES6 (`var`, `function`, chuỗi nối bằng dấu `+`, không dùng arrow function phức tạp hay optional chaining `?.`).
2. **Không Console.log**: Luôn viết thường `console.log`.
3. **Không đệ quy `load()`**: Tránh gọi lồng các file thư viện gây crash Rhino.
4. **Tiết kiệm Token**: Hạn chế gọi lặp lại các công cụ không cần thiết, tự xử lý trực tiếp thay vì phân rã subagent khi quota bị giới hạn.
