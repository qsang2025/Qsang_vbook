# Báo cáo Cụm bước 3: Triển khai các script Đọc truyện (detail, toc, chap)

**Extension:** `extensions/chinese_novel/qimao`  
**Ngày thực hiện:** 2026-11-09  
**Người thực hiện:** Executor Sub-agent (Cluster 3)  
**Nhánh:** `feature/qimao-ag`

---

## 1. Kết quả thực hiện

### 1.1. `src/detail.js` (Step 6)
- Tương thích 100% Rhino ES6: chỉ dùng `var`, `function`, không có `load()` lồng nhau.
- Trích xuất `book_id` từ URL hoặc input (hỗ trợ cả link web `https://www.qimao.com/shuku/<id>/` lẫn chuỗi số ID).
- Gọi API di động chính thức: `GET https://api-bc.wtzw.com/api/v5/book/detail?id=<book_id>&sign=<sign>` kèm `buildHeaders()`.
- Bóc tách đầy đủ các trường chuẩn theo `extension-api.md`:
  - `name`: Tên truyện đã làm sạch ký tự.
  - `author`: Tác giả thật (`b.author` hoặc `b.original_author`).
  - `cover`: Ảnh bìa chất lượng cao (`b.image_link` hoặc `b.thumb_image_link`), tự động chuẩn hóa tiền tố `https:`.
  - `description`: Tóm tắt truyện sạch.
  - `detail`: Thể loại, số chữ, trạng thái kèm tiêu đề chương mới nhất.
  - `ongoing`: Boolean (`true` khi còn tiếp, `false` khi đã hoàn thành).
  - `url` & `host`: `https://www.qimao.com/shuku/<book_id>/`.
  - Bắt lỗi HTTP và trả về `Response.error(...)` tiếng Việt nếu kết nối thất bại.

### 1.2. `src/toc.js` (Step 7)
- Trích xuất `book_id` từ URL sách.
- Ký sign `id=<book_id>` gọi Native API: `GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list?id=<book_id>&sign=<sign>` kèm `buildHeaders()`.
- Bóc tách toàn bộ mảng chương thật từ `json.data.chapter_lists`:
  - Trích xuất mã định danh chương thật từ hệ thống 七猫 (ví dụ: `17084124930001`, `36898237`), tuyệt đối không tự bịa đặt ID.
  - `name`: Tiêu đề chương chuẩn (`item.title`).
  - `url`: `https://www.qimao.com/shuku/<book_id>/<chapter_id>/`.
  - `host`: `https://www.qimao.com`.
- Đã kiểm thử thực tế:
  - Sách `1803136` (第一凤女): trả về đầy đủ **1.130 chương**.
  - Sách `143170` (剑来): trả về đầy đủ **1.279 chương**.

### 1.3. `src/chap.js` (Step 8)
- Bóc tách `book_id` và `chapter_id` từ URL chương (hoặc query string fallback).
- Ký sign theo đúng quy tắc thứ tự tham số `chapterId=<chapter_id>id=<book_id>`:
  - Gọi Native API: `GET https://api-ks.wtzw.com/api/v1/chapter/content?chapterId=<chapter_id>&id=<book_id>&sign=<sign>` kèm `buildHeaders()`.
- **Giải mã AES-128-CBC bảo mật**:
  - Dữ liệu `data.content` dạng Base64 được chuyển sang Hex.
  - 32 ký tự Hex đầu tiên (16 bytes) được tách làm IV động.
  - Phần Hex còn lại là Ciphertext.
  - Khóa AES-128 cố định của 七猫: Hex `32343263636238323330643730396531` (tương ứng `"242ccb8230d709e1"`).
  - Sử dụng module `CryptoJS` (đã inline trong `crypto.js`) với mode `CBC`, padding `Pkcs7` giải mã ra UTF-8 hoàn chỉnh.
- **Định dạng văn bản**:
  - Chuẩn hóa ngắt dòng, lọc bỏ khoảng trắng thừa / ký tự vô hình.
  - Bọc từng đoạn văn bản trong thẻ `<p>...</p>`.
  - Loại bỏ các dòng quảng cáo app nếu có.
  - Bắt lỗi API và thông báo tiếng Việt rõ ràng khi gặp chương bị khóa/yêu cầu mở khóa VIP trong app 七猫.
- Đã kiểm thử giải mã thực tế:
  - Chương 1 sách `1803136`: Giải mã 100% chính xác, độ dài văn bản 2.655 ký tự HTML.
  - Chương 1 sách `143170`: Giải mã 100% chính xác, độ dài 3.344 ký tự HTML.

---

## 2. Kiểm định Linter Rhino ES6
- Quét toàn bộ `detail.js`, `toc.js`, `chap.js`:
  - 0 `const`, 0 `let`.
  - 0 arrow function `=>`.
  - 0 template literal (`` `...` ``).
  - 0 optional chaining `?.`, nullish coalescing `??`, spread operator.
  - Không có lệnh `load()` lồng nhau.

---

## 3. Trạng thái Git & Kế hoạch tiếp theo
- Chuẩn bị commit với thông điệp: `feat(qimao): implement reading scripts (detail, toc, chap with AES-128-CBC)`.
- Sẵn sàng bàn giao cho Cụm bước 4: Tạo Fixtures (`test.json`, `health.json`), đóng gói `plugin.zip`, sinh catalog và kiểm định validate toàn diện.
