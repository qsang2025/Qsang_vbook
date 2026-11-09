# Extension Qimao (七猫免费小说) — vBook

Extension vBook dành cho kho truyện chữ miễn phí chất lượng cao **七猫免费小说 (Qimao)** tại `https://www.qimao.com`.
Type: `chinese_novel`, Locale: `zh_CN`, Mã hóa: `false`.

- **Tác giả quy định**: `MuseAi` (Phiên bản đối soát tính năng song song theo phân công của anh Sáng)
- **Phiên bản (Version)**: `1`
- **Kho nguồn backend**: Hệ sinh thái API app di động Seven Cat Reader (`wtzw.com` / `qimao.com`)

---

## 1. Kiến trúc Kỹ thuật & Luồng Dữ liệu (Architecture & Data Flow)

Khác với các nguồn bóc tách HTML thông thường dễ bị chặn bởi Web Application Firewall (WAF) hoặc chống cào dữ liệu, extension **Qimao** tận dụng trực tiếp kiến trúc **Native Mobile App API** của ứng dụng 七猫 (phiên bản Android 7.19.0) để đảm bảo dữ liệu có cấu trúc JSON sạch, thời gian phản hồi cực nhanh (< 100ms) và không phụ thuộc vào bố cục giao diện web thay đổi.

### A. Hệ thống Endpoint API di động

1. **Book Core & Tìm kiếm (`api-bc.wtzw.com`)**:
   - `GET /api/v7/search/words?wd=<từ_khóa>&page=<trang>&sign=<sign>`: Tìm kiếm sách truyện theo từ khóa.
   - `GET /api/v5/book/detail?id=<book_id>&sign=<sign>`: Lấy chi tiết thông tin sách, ảnh bìa, tóm tắt, trạng thái hoàn thành.
2. **Chapter Services & Đọc truyện (`api-ks.wtzw.com`)**:
   - `GET /api/v1/chapter/chapter-list?id=<book_id>&sign=<sign>`: Lấy toàn bộ danh sách chương thật (trả về danh sách đầy đủ không phân trang).
   - `GET /api/v1/chapter/content?chapterId=<chapter_id>&id=<book_id>&sign=<sign>`: Tải payload nội dung chương đã mã hóa AES.
3. **Thư viện Web Danh mục (`www.qimao.com/shuku/`)**:
   - Khai thác danh mục tĩnh 122 thể loại (`genre.js`) và phân trang danh sách truyện (`gen.js`) từ hệ thống SSR Nuxt của `qimao.com`.

---

## 2. Cơ chế Bảo mật & Ký Request (MD5 Signature)

Mọi request gọi tới backend `wtzw.com` đều phải vượt qua 2 tầng xác thực:

### 1. App Headers tĩnh
```javascript
headers = {
    "platform": "android",
    "app-version": "71900",
    "application-id": "com.kmxs.reader",
    "sign": CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + API_SALT).toString(),
    "user-agent": "webviewversion/0"
};
```

### 2. Query Parameter Signature (`signQuery`)
- **Muối bảo mật (API Secret Salt)**: `d3dGiJc651gSQ8w1`
- **Quy tắc ký**: Các tham số query được sắp xếp theo thứ tự bảng chữ cái (ví dụ: `chapterId=...id=...`), nối trực tiếp với muối bí mật, sau đó băm bằng thuật toán **MD5**.
  $$\text{sign} = \text{MD5}(\text{ParamString} + \text{"d3dGiJc651gSQ8w1"})$$

---

## 3. Cơ chế Mã hóa & Giải mã Nội dung Chương (AES-128-CBC)

Nội dung chương trả về từ `api-ks.wtzw.com` ở trường `data.content` được bảo vệ bằng mật mã học đối xứng:

1. **Chuỗi Ciphertext**: Là chuỗi mã hóa dạng Base64.
2. **Khởi tạo IV động**:
   - Chuỗi Base64 được giải mã thành chuỗi Hex (hoặc Byte Array).
   - **32 ký tự Hex đầu tiên (16 bytes = 128 bits)** chính là Vector khởi tạo (`IV`).
   - Phần chuỗi Hex còn lại là `Ciphertext` thực sự.
3. **Khóa bí mật (AES Secret Key)**:
   - Chuỗi Hex: `32343263636238323330643730396531`
   - Chuỗi ASCII tương ứng: `"242ccb8230d709e1"` (16 bytes = 128 bits).
4. **Thuật toán & Chế độ**:
   - `AES-128-CBC`
   - Padding: `PKCS#7` (Pkcs7)
5. **Định dạng hiển thị**:
   - Plaintext sau giải mã là chuỗi văn bản phân cách bởi dấu xuống dòng `\n`.
   - Script `chap.js` tự động làm sạch các ký tự escape HTML, loại bỏ quảng cáo/rác bản quyền và bọc từng đoạn trong thẻ `<p>...</p>`, đồng thời truyền `chapterTitle` vào tham số thứ hai của `Response.success(content, title)` để app vBook hiển thị tên chương trên thanh công cụ.

---

## 4. Ý tưởng Kỹ thuật Sáng tạo & Kiến trúc Mở rộng (Creative Engineering)

Theo định hướng nghiên cứu và phát triển extension thế hệ mới của anh Sáng, extension này ghi nhận các ý tưởng kỹ thuật quan trọng:

### A. Ý tưởng xử lý Chương VIP / Khóa nội dung (Smart VIP & Mirror Fallback)
- **Nhận diện trạng thái khóa**: Khi chương yêu cầu trả phí hoặc mở khóa quảng cáo trong app 七猫, API trả về trường `errors` hoặc `data.content` rỗng. Script hiện tại trả về thông báo lỗi tiếng Việt thân thiện: `"Chương yêu cầu mở khóa trong ứng dụng 七猫"`.
- **Cơ chế Fallback thông minh (Đề xuất tương lai)**:
  - Khi phát hiện `errors` hoặc HTTP 403 từ API Qimao, tự động kích hoạt bộ chuyển mạch (Adapter) sang các kho truyện raw mở (chẳng hạn như `69shu`, `ixdzs8`, `biquge`).
  - Sử dụng tên truyện (`book.title`) và số thứ tự chương (`chapter_sort`) để truy vấn tự động kho raw dự phòng, lấy nội dung chương thay thế mà người đọc không bị gián đoạn trải nghiệm đọc.

### B. Ý tưởng Failover Mirror & Dự phòng mạng (Cluster Luân chuyển)
- Hiện tại hệ thống máy chủ của 七猫 phân tải qua 2 cụm domain chính: `api-bc.wtzw.com` (Book Core) và `api-ks.wtzw.com` (Reading Content).
- **Ý tưởng cấu hình Fallback động**: Trong `config.js`, có thể bổ sung danh sách mirror:
  - `MIRROR_BC = ["https://api-bc.wtzw.com", "https://api-bc-backup.wtzw.com"]`
  - `MIRROR_KS = ["https://api-ks.wtzw.com", "https://api-ks-backup.wtzw.com"]`
  - Nếu một cụm server gặp sự cố hoặc bị phân giải DNS lỗi, hàm `fetchWithFallback()` sẽ tự động luân chuyển sang mirror dự phòng hoặc fallback về cào giao diện web máy tính `www.qimao.com`.

### C. Các hạn chế kỹ thuật chưa thể triển khai & Lý do
1. **Đăng nhập tài khoản VIP 七猫 trực tiếp trong vBook**:
   - *Rào cản*: Hệ thống đăng nhập của 七猫 yêu cầu số điện thoại di động nội địa Trung Quốc (+86) và cơ chế xác thực Captcha trượt (Geetest / Tencent Captcha) cùng SMS OTP. App vBook chạy môi trường headless / WebView tiêu chuẩn nên không thể lưu trữ hay duy trì session đăng nhập tự động một cách an toàn và bền vững.
2. **Tải trước toàn bộ kho chương VIP mã hóa bằng Token người dùng**:
   - *Rào cản*: Token người dùng được gắn chặt với Device Fingerprint (`IMEI`, `Android_ID`, `OAID`) và thay đổi liên tục theo từng phiên đăng nhập, việc giả lập toàn bộ hệ thống định danh thiết bị sẽ gây rủi ro khóa tài khoản của người dùng.

---

## 5. Quy chuẩn Repo & Kiểm định Chất lượng (Verification)

Extension đã trải qua quy trình kiểm thử nghiêm ngặt theo bộ quy tắc của `Qsang_vbook`:
- **Linter Rhino ES6**: Toàn bộ script dùng chuẩn cú pháp `var`, `function`, nối chuỗi `+`; tuyệt đối không dùng cú pháp ES6+ không được Rhino hỗ trợ.
- **Quy tắc `load()`**: `config.js` độc lập không gọi `load()`. Các file script chính tự nạp thư viện top-level.
- **Kiểm định CLI**:
  ```bash
  node scripts/cli.js validate
  # Kết quả: Đã kiểm tra 19 nguồn, 19 mục trong registry: PASS (0 cảnh báo).
  node scripts/cli.js build-catalog --check
  # Kết quả: OK: plugin.json khớp với 19 nguồn trên đĩa.
  ```
- **Golden Fixture (`test.json`)**: Đã cấu hình case kiểm thử chi tiết cho cả 7 script dựa trên dữ liệu thật của bộ truyện mẫu *Đệ Nhất Phượng Nữ (第一凤女 - ID: 1803136)* và *Kiếm Lai (剑来 - ID: 143170)*.
- **CI Health Probe (`health.json`)**: Định nghĩa điểm kiểm tra sức khỏe HTTP 200 và pattern nhận diện thương hiệu 七猫 trên `https://www.qimao.com`.
