# Context Bundle: Qimao Extension (七猫免费小说)

- **Ngày khảo sát**: 2026-11-09
- **Repo**: `/home/antigravity/qsang2025/Qsang_vbook` (nhánh `feature/qimao-ag`)
- **Tác vụ**: Khảo sát kỹ thuật và chuẩn bị ngữ cảnh để tạo extension vBook cho `qimao.com` (`chinese_novel`)

---

## 1. Bố cục repo liên quan (Repo layout)

- `extensions/chinese_novel/qimao/`: Thư mục extension mục tiêu.
  - `plugin.json`: Khai báo manifest nguồn (`author: "MuseAi"`, `version: 1`, `type: "chinese_novel"`, `locale: "zh_CN"`).
  - `icon.png`: Icon chính thức của ứng dụng Qimao.
  - `src/config.js`: Khai báo hằng số domain, endpoint app API và app secret key. Không chứa lệnh `load()`.
  - `src/home.js`: Trả về các tab danh mục tĩnh.
  - `src/genre.js`: Danh sách các thể loại nam/nữ.
  - `src/gen.js`: Phân trang lấy danh sách sách theo chuyên mục/thể loại từ web hoặc API.
  - `src/search.js`: Tìm kiếm truyện qua API app Qimao.
  - `src/detail.js`: Lấy thông tin chi tiết sách qua API app Qimao (`api-bc.wtzw.com`).
  - `src/toc.js`: Lấy toàn bộ mục lục chương truyện qua API app Qimao (`api-ks.wtzw.com`).
  - `src/chap.js`: Lấy và giải mã AES-128-CBC nội dung chương qua API app Qimao.
  - `src/crypto.js`: Thư viện mã hóa / giải mã inline từ `lib/crypto.js` (cung cấp CryptoJS: MD5, Base64, Hex, AES).
  - `test.json`: Golden fixture để kiểm thử trên máy thật qua Developer Server.
  - `health.json`: Fixture nhẹ để CI probe kiểm tra tự động.
  - `plugin.zip`: File zip đóng gói thành phẩm do CLI sinh ra.
- `lib/crypto.js`: Thư viện CryptoJS chuẩn của repo (đã test tương thích Rhino ES6, hỗ trợ MD5 và AES-CBC).
- `scripts/cli.js`: CLI một cửa của repo (`validate`, `build`, `build-catalog`, `health-check`).
- `tools/cli/validate.js`: Công cụ linter & đối soát toàn vẹn repo.
- `extension-api.md`: Hợp đồng API chuẩn duy nhất của vBook engine.

---

## 2. Quy tắc nhà bắt buộc (Project rules)

1. **Nguồn sự thật duy nhất**: `src/` là nguồn sự thật. Không sửa tay trong `plugin.zip`. Build zip bằng CLI `node scripts/cli.js build extensions/chinese_novel/qimao`.
2. **Registry sinh tự động**: Không sửa tay `plugin.json` ở root repo. Luôn chạy `node scripts/cli.js build-catalog`.
3. **Cú pháp tương thích Rhino ES6**:
   - Chỉ dùng: `var`, `function`, nối chuỗi `+`.
   - Cấm: `const`, `let`, `async/await`, Arrow functions (`() => {}`), Template literals (`` `...` ``), Optional chaining (`?.`), Nullish coalescing (`??`), Spread operators (`...`), `.flat()`.
4. **Cơ chế `load()` của vBook**:
   - `load('file.js')` là text substitution, chỉ nạp file ở top-level của `src/`.
   - **Tuyệt đối KHÔNG đệ quy**: File được `load()` không được phép `load()` tiếp file khác.
   - `config.js` **không được chứa lệnh `load()`**. Các file script chính tự load `config.js` và `crypto.js` ở đầu file.
   - Các file tab tĩnh như `home.js`, `genre.js` không cần gọi `load('config.js')`.
5. **Định dạng Tác giả & Phiên bản**:
   - Yêu cầu cho bản thử nghiệm này: `"author": "MuseAi"` (để so sánh song song với bản của Bẹp).
   - Version bắt đầu từ 1.
6. **Xử lý lỗi**:
   - Lỗi trả về `Response.error("Thông báo tiếng Việt")`, không bao giờ `return null`.
7. **Tab Trang chủ tĩnh (`home.js`)**:
   - `home.js` chỉ trả mảng tab tĩnh (`[{ title, input, script }]`), không fetch HTTP để tránh chặn mở extension.

---

## 3. Khảo sát kỹ thuật & Dữ liệu thực tế đã xác minh (Verified facts)

### A. Tình trạng Network & WAF đối với qimao.com
- `https://www.qimao.com/`: Truy cập từ IP datacenter/cloud trả về **HTTP/2 200 OK** (Server: `istio-envoy`), không bị Cloudflare hay captcha chặn.
- `https://m.qimao.com/`: Chuyển hướng 302 sang `https://zhushou.qimao.com/become-author`. Do đó không dùng mobile web.
- Hệ thống backend chính thức phục vụ app di động là mạng `wtzw.com` (Văn Hóa Vạn Đạt / 七猫免费小说):
  - `https://api-bc.wtzw.com` (Book Core / Search / Detail)
  - `https://api-ks.wtzw.com` (Chapter Content / TOC)
  - `https://cdn.wtzw.com` (Ảnh bìa CDN)
- Cả hai domain API trên đều phản hồi trực tiếp **HTTP 200 JSON** ổn định, không chặn IP, tốc độ phản hồi < 100ms.

### B. Cơ chế xác thực & Ký API (API Signature & App Header)
App di động 七猫 gửi request với các header cố định:
```javascript
headers = {
    "platform": "android",
    "app-version": "71900",
    "application-id": "com.kmxs.reader",
    "sign": CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=androidd3dGiJc651gSQ8w1").toString(),
    "user-agent": "webviewversion/0"
};
```
Chuỗi muối bảo mật bí mật của app: `d3dGiJc651gSQ8w1`.

Mỗi request kèm tham số `sign` trên query string:
- Ký theo query tham số đã ghép với muối: `CryptoJS.MD5(query_str + "d3dGiJc651gSQ8w1").toString()`.

### C. Khảo sát các Endpoint chính đã xác thực

1. **Tìm kiếm (Search)**:
   - Endpoint: `GET https://api-bc.wtzw.com/api/v7/search/words?wd=<keyword>&sign=<sign>`
   - Query ký: `wd=<keyword>d3dGiJc651gSQ8w1`
   - Đã test với từ khóa `"剑来"`: Trả về danh sách sách chính xác kèm `id`, `original_title`, `original_author`, `image_link`, `intro`, `is_over`.

2. **Chi tiết sách (Detail)**:
   - Endpoint: `GET https://api-bc.wtzw.com/api/v5/book/detail?id=<book_id>&sign=<sign>`
   - Query ký: `id=<book_id>d3dGiJc651gSQ8w1`
   - Đã test với book id `1803136` (第一凤女): Trả về đầy đủ:
     - `title`: 第一凤女
     - `author`: 十二妖 (hoặc `author_uid`)
     - `thumb_image_link`: link ảnh bìa CDN
     - `intro`: mô tả tóm tắt truyện
     - `latest_chapter_title`: tên chương mới nhất
     - `is_over`: 1 (hoàn thành) hoặc 0 (đang ra)
     - `score`: điểm đánh giá (vd 9.7)
     - `category_over_words`: phân loại và tổng số chữ

3. **Mục lục chương (TOC)**:
   - Endpoint: `GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list?id=<book_id>&sign=<sign>`
   - Query ký: `id=<book_id>d3dGiJc651gSQ8w1`
   - Đã test với book id `1803136`: Trả về 1.130 chương thật:
     - `id`: vd `"17084124930001"` (link thật, không bịa)
     - `title`: `第1章  卑贱庶子才是她的亲生孩子`
     - `chapter_sort`: thứ tự chương

4. **Nội dung chương (Chap)**:
   - Endpoint: `GET https://api-ks.wtzw.com/api/v1/chapter/content?chapterId=<chapterId>&id=<book_id>&sign=<sign>`
   - Query ký: `chapterId=<chapterId>id=<book_id>d3dGiJc651gSQ8w1`
   - Thuật toán giải mã:
     - Dữ liệu trả về `data.content` là chuỗi Base64.
     - Giải mã Base64 ra chuỗi Hex (hoặc Byte array).
     - 32 ký tự Hex đầu tiên (16 bytes) chính là `IV`.
     - Phần Hex còn lại là `Ciphertext`.
     - Khóa bí mật AES-128: `32343263636238323330643730396531` (Hex của chuỗi `"242ccb8230d709e1"`).
     - Thuật toán: `AES-128-CBC`, Padding: `Pkcs7`.
     - Đã giải mã thực tế thành công văn bản chương 1 của truyện `1803136` trơn tru 100%.

5. **Thể loại & Danh sách (Genre & Gen)**:
   - Web `https://www.qimao.com/shuku/` cung cấp hệ thống phân loại danh mục phong phú:
     - Nam: Lịch sử, Quân sự, Khoa huyễn, Võng du, Huyền huyễn, Đô thị, Huyền nghi, Tiên hiệp...
     - Nữ: Hiện đại ngôn tình, Cổ đại ngôn tình, Huyền ảo tu chân, Trọng sinh...
   - Cấu trúc URL danh sách thư viện: `https://www.qimao.com/shuku/<filter>-update_time-<page>/`.

---

## 4. Các ràng buộc kỹ thuật (Constraints)

- **Cấm đụng chạm vào**:
  - Nhánh `feature/qimao-muse` (dành cho agent Muse).
  - Không push lên nhánh `main`.
- **Ràng buộc mã nguồn**:
  - Không nạp `crypto.js` bên trong `config.js` (vi phạm Rule 1 Rhino load recursion).
  - Sử dụng file thư viện `lib/crypto.js` chuẩn có sẵn của `Qsang_vbook` (đã xác minh đầy đủ `MD5`, `Hex`, `Base64`, `AES`).
  - Toàn bộ code phải được format sạch sẽ, comment tiếng Việt rõ ràng, bọc `try/catch` xử lý ngoại lệ cẩn thận.
- **Bảo mật**: Tuyệt đối không commit bất kỳ thông tin nhạy cảm của người dùng nào. Các khóa sign / app headers đều là public API headers của ứng dụng 七猫.

---

## 5. Tài liệu và file tham chiếu (Source files)

- [AGENTS.md](file:///home/antigravity/qsang2025/Qsang_vbook/AGENTS.md)
- [extension-api.md](file:///home/antigravity/qsang2025/Qsang_vbook/extension-api.md)
- [.agents/skills/vbook-extensions/SKILL.md](file:///home/antigravity/qsang2025/Qsang_vbook/.agents/skills/vbook-extensions/SKILL.md)
- [.agents/skills/vbook-extensions/modes/create.md](file:///home/antigravity/qsang2025/Qsang_vbook/.agents/skills/vbook-extensions/modes/create.md)
- [tools/cli/validate.js](file:///home/antigravity/qsang2025/Qsang_vbook/tools/cli/validate.js)
- [lib/crypto.js](file:///home/antigravity/qsang2025/Qsang_vbook/lib/crypto.js)
- Tham khảo bản cũ đã ngưng cập nhật: `/home/antigravity/qsang2025/vbooks-extension_lethituyen/qimao`
