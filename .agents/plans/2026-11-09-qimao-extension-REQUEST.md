# Yêu cầu tác vụ: Tạo extension Qimao (七猫免费小说) trên repo Qsang_vbook

- **Ngày tạo**: 2026-11-09
- **Nhánh thực hiện**: `feature/qimao-ag` (tách từ `main`, repo `/home/antigravity/qsang2025/Qsang_vbook`)
- **Tác giả quy định**: `"author": "MuseAi"` (dùng để đối soát song song với bản của Bẹp)
- **Loại extension**: `chinese_novel`
- **Thư mục mục tiêu**: `extensions/chinese_novel/qimao/`

---

## 1. Mục tiêu và Phạm vi tác vụ

Tạo hoàn chỉnh extension vBook cho nguồn **Qimao (七猫免费小说 - qimao.com)** đạt chuẩn chất lượng cao nhất của dự án `Qsang_vbook`:
1. Hỗ trợ đọc truyện chữ tiếng Trung (`chinese_novel`) từ hệ thống Qimao (`https://www.qimao.com` và API di động chính thức của app 七猫 `wtzw.com`).
2. Cung cấp đầy đủ vòng đời script theo hợp đồng vBook `extension-api.md`:
   - `home.js`: Trả về các tab danh mục tĩnh (Nam, Nữ, Xuất bản, Mới nhất...).
   - `genre.js`: Danh sách thể loại phân loại nam/nữ rõ ràng.
   - `gen.js`: Lấy danh sách truyện theo thể loại / tab với phân trang chuẩn.
   - `search.js`: Tìm kiếm truyện bằng từ khóa qua API chính thức.
   - `detail.js`: Lấy thông tin chi tiết truyện (tên, tác giả, ảnh bìa, mô tả, trạng thái ra chương, điểm đánh giá...).
   - `toc.js`: Lấy danh sách toàn bộ mục lục chương (link thật, chapterId thật, không bịa đặt).
   - `chap.js`: Giải mã và hiển thị nội dung chương truyện đầy đủ, sạch sẽ, chuẩn định dạng vBook.
3. Đóng gói `plugin.zip` tự động qua `scripts/cli.js build`.
4. Cập nhật registry root `plugin.json` qua `scripts/cli.js build-catalog`.
5. Tạo Golden Fixture `test.json` và Fixture nhẹ CI `health.json`.
6. Đạt chuẩn xác thực: `node scripts/cli.js validate` trả về **PASS (0 cảnh báo)**.

---

## 2. Tiêu chí Hoàn thành (Definition of Done - DoD)

1. [ ] Đang làm việc trên nhánh `feature/qimao-ag`.
2. [ ] Thư mục `extensions/chinese_novel/qimao/` có đủ cấu trúc:
   - `plugin.json`: Metadata đúng (`author: "MuseAi"`, `version: 1`, `type: "chinese_novel"`, `locale: "zh_CN"`, `source: "https://www.qimao.com"`, regexp chuẩn). Script map đầy đủ 6 script chính + config helper.
   - `icon.png`: Icon thật của 七猫 (dưới 5MB, decodable).
   - `src/config.js`: Cấu hình BASE_URL, API endpoints, secret key, SALT phục vụ ký API.
   - `src/home.js`, `src/genre.js`, `src/gen.js`, `src/search.js`, `src/detail.js`, `src/toc.js`, `src/chap.js`.
   - `src/crypto.js`: Bản inline từ `lib/crypto.js` phục vụ giải mã AES-CBC và băm MD5 cho API Qimao.
   - `test.json`: Golden fixture kiểm thử chi tiết từng script với dữ liệu thật.
   - `health.json`: Fixture nhẹ để CI kiểm tra HTTP/pattern định kỳ.
   - `plugin.zip`: Build tự động từ CLI, đồng bộ 100% với file trên đĩa.
3. [ ] Cú pháp JavaScript trong mọi file `src/*.js` tuân thủ nghiêm ngặt **Rhino ES6**:
   - Chỉ dùng `var`, `function`, chuỗi nối `+`.
   - Cấm: `const`, `let`, arrow function `() =>`, template literals ````, `async/await`, optional chaining `?.`, nullish coalescing `??`, spread operator `...`, `.flat()`.
   - Cơ chế `load()` tuân thủ: chỉ load file ở top level của `src/`, tuyệt đối KHÔNG đệ quy (`config.js` không được `load()`).
4. [ ] Xử lý lỗi luôn trả về `Response.error("...")` tiếng Việt, không `return null`.
5. [ ] Bộ test & CLI xác minh:
   - `node scripts/cli.js validate` -> **PASS (0 cảnh báo)**.
   - `node scripts/cli.js build-catalog --check` -> **PASS (khớp hoàn toàn)**.
6. [ ] Lưu tiến độ vào file Plan và commit trên nhánh `feature/qimao-ag`.

---

## 3. Những điều TUYỆT ĐỐI KHÔNG LÀM (Strict Prohibitions)

- ❌ **TUYỆT ĐỐI KHÔNG chạm vào nhánh `feature/qimao-muse`**: Nhánh đó dành cho đối soát song song của Muse/Bẹp.
- ❌ **TUYỆT ĐỐI KHÔNG push trực tiếp lên `main`**: Mọi công việc chỉ commit và push trên `feature/qimao-ag`.
- ❌ **KHÔNG tự bịa đặt, suy đoán link truyện hay số chương**: Toàn bộ book ID, chapter ID và link nội dung phải lấy từ phản hồi thật của API / web Qimao.
- ❌ **KHÔNG sửa tay file `plugin.json` ở root repo**: File này chỉ được sinh tự động bằng `node scripts/cli.js build-catalog`.
- ❌ **KHÔNG sửa tay hoặc đóng gói file `plugin.zip` bằng tool ngoài**: Chỉ dùng `node scripts/cli.js build`.
- ❌ **KHÔNG commit token / cookie riêng tư hay secret mật của người dùng**: API sign key là hằng số công khai của app Android Qimao thì được đặt trong `config.js`, không có credential cá nhân.
- ❌ **KHÔNG dùng `encrypt: true`** trong `plugin.json`.
