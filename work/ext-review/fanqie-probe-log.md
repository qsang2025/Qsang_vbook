# Nhật Ký Đo Kiểm Trực Tiếp (Live Probe Log) — Fanqienovel.com

- **Thời gian thực hiện:** 2026-11-11 01:18 – 01:24 UTC
- **Môi trường:** Linux Sandbox (Debian 12), kết nối ra ngoài qua HTTP/HTTPS Proxy.
- **Ranh giới tuân thủ:** Request tuần tự, sleep ≥ 3.5s giữa các request, User-Agent Chrome 120 tiêu chuẩn, không đăng nhập, không cookie cá nhân, không vượt captcha, không gọi bên thứ ba.

---

## 1. Tổng Hợp Kết Quả Probe Các Endpoint

### Mục a: Danh Mục & Xếp Hạng (Discovery, Categories, Rankings)

1. **`GET /api/author/book/category_list/v0/`**
   - **Status:** HTTP 200 OK
   - **Content-Length:** 48.052 bytes (Transfer-Encoding: chunked)
   - **Bdturing-Verify Header:** `null` (KHÔNG BỊ CHẶN BỞI BDTURING)
   - **Dữ liệu trả về:** JSON chứa danh mục phân loại sách hoàn chỉnh của nền tảng Fanqie.
   - **Mẫu dữ liệu:**
     ```json
     {"code":0,"data":[{"category_id":747,"label":"主分类","name":"女频悬疑","cover_uri":"http://p3-novel.byteimg.com/novel-static/e7987b204cf7ee6d7ffbf83e6109011d~tplv-noop.image","description":"以女性视角为主，讲述不同时代背景下的探案、推理、灵异故事"},{"category_id":1141,"label":"主分类","name":"西方奇幻",...}]}
     ```
   - **Đánh giá:** Endpoint mở hoàn toàn, có thể dùng làm nguồn cho `genre.js`.

2. **`GET /api/rank/recommend/list?type=1&offset=0&limit=10`**
   - **Status:** HTTP 200 OK
   - **Content-Length:** 8.767 bytes (Transfer-Encoding: chunked)
   - **Bdturing-Verify Header:** `null` (KHÔNG BỊ CHẶN)
   - **Dữ liệu trả về:** Danh sách truyện gợi ý/thịnh hành theo bảng xếp hạng. Có đầy đủ `bookName`, `bookId`, `thumbUri`, `abstract`.
   - **Mẫu dữ liệu:**
     ```json
     {"data":{"list":[{"bookName":"心肝宠","bookId":"7096667097870109733","thumbUri":"https://p9-novel-sign.byteimg.com/novel-pic/a47a34f4d7a65bdb1415994822471272~tplv-resize:225:300.image?lk3s=191c1ecc&x-expires=1794446438&x-signature=pFQuQ6%2FxK%2BqYJH8qjYlzVnBoiSw%3D","abstract":"（顶级豪门+女主现代江南风美人+男主疯批+前期女..."}]}}
     ```
   - **Đánh giá:** Hoạt động ổn định, có thể dùng làm dữ liệu cấp cho các tab trong `home.js`.

3. **`GET /api/author/misc/top_book_list/v1/?offset=0&limit=10`**
   - **Status:** HTTP 200 OK
   - **Content-Length:** 12.108 bytes
   - **Bdturing-Verify Header:** `null` (KHÔNG BỊ CHẶN)
   - **Dữ liệu trả về:** Danh sách top sách theo điểm xếp hạng: `book_id`, `book_name`, `author`, `category`, `thumb_url`.
   - **Mẫu dữ liệu:**
     ```json
     {"book_list":[{"author":"三九音域","book_id":"7276384138653862966","book_name":"我不是戏神","category":"都市高武","creation_status":0,"rank_score":"","thumb_url":"https://p3-reading-sign.fqnovelpic.com/novel-pic/p2o99ffbfd13492eb9953715959db26ed9b~tplv-snk2bdmkp8-superreso-double-rz:1200:0.image?lk3s=ae45642e..."}]}
     ```
   - **Đánh giá:** Mở hoàn toàn, chất lượng dữ liệu sạch và đầy đủ.

4. **`GET /api/rank/category/list?app_id=2503&rank_list_type=3&offset=0&limit=10`**
   - **Status:** HTTP 200 OK (Code -1: `分类类型错误`, 118 bytes)
   - **Bdturing-Verify Header:** `null`
   - **Đánh giá:** Không bị bdturing, endpoint hoạt động nhưng cần truyền đúng mã `rank_list_type` hợp lệ từ client.

5. **`GET /api/library/book_list?page_index=0&page_count=10`**
   - **Status:** HTTP 200 OK (Code -1: `invalid params, category_id不为空`, 136 bytes)
   - **Bdturing-Verify Header:** `null`
   - **Đánh giá:** Không bị bdturing, yêu cầu tham số `category_id`.

6. **`GET /api/author/library/book_list/v0/?page_index=0&page_count=10`**
   - **Status:** HTTP 200 OK (Code -2: `参数有误`, 92 bytes)
   - **Bdturing-Verify Header:** `null`
   - **Đánh giá:** Không bị bdturing, cần tham số cụ thể hơn.

---

### Mục b: Mục Lục & Bình Luận (TOC Directory & Comments)

1. **`POST /api/reader/directory/list` (Body: `{"itemIds": ["7069952706521236001"]}`)**
   - **Status:** HTTP 200 OK
   - **Content-Length:** 228 bytes
   - **Bdturing-Verify Header:** `null` (KHÔNG BỊ CHẶN)
   - **Dữ liệu trả về:**
     ```json
     {"data":[{"volumeName":"第一卷：默认","itemId":"7069952706521236001","title":"第1章 部族生死战","needPay":0,"order":1}],"code":0,"message":"success","log_id":"20261111092053D384718299B73E21A18D","now":1794360053829}
     ```
   - **Đánh giá:** Endpoint POST danh sách itemIds trả về metadata chương mà không bị bdturing.

2. **`GET /api/reader/directory/list?bookId=...`**
   - **Status:** HTTP 404 (Endpoint không hỗ trợ method GET, API TOC qua GET nằm ở `/api/reader/directory/detail?bookId=...`).

3. **`GET /api/comment/get_book_comment?bookId=7069948840148732967&offset=0&limit=10`**
   - **Status:** HTTP 200 OK (Trả về RPC error `req param invalid, req=GetNovelBookCommentDetailReq`, length 3.370 bytes)
   - **Bdturing-Verify Header:** `null` (Không bị bdturing).

---

### Mục c: Xác Nhận Lại Reader Full & Search (Anti-Bot Choke Points)

1. **`GET /api/reader/full?itemId=7069952706521236001`**
   - **Status:** HTTP 200 OK
   - **Content-Length:** **0** (Body hoàn toàn rỗng)
   - **Bdturing-Verify Header:**
     ```json
     {"code":"10000","from":"","type":"verify","version":"","region":"cn","subtype":"slide","ui_type":"","detail":"v6Pa4SUTSjMyKAhvQ*VuqErpyGhwuBHZwv4Jh1hkXmxYkmnhpj-oZk*ep9oop-GAydfb6F600SOXVzNZ*N0JrYdmTuleu7bYZL-8lo6Ffe2VtNPCMp1YnOOK7*3xqqxYjEdMchK3vquo5kxdsNmgh5Kj0f9pFOrOqc-wH*pus*g-lksofoG6Wqfd9rnoizb*gGggIEFqcgNKySAKUcRC7Ok5fZWqO6PBP-fg2evG1P6R4P0IavNye2j4Vxz3DD3FMvbkZwaIaucJvrd3JIIjxrNlu5oiqbMTq*dStzAPBYrlBDZrNlB*f4DSvBpuFrm654eR8X3xz9slFWA4Sk6MWE7jexv5HZkJlxJIGlmmFYaW4SZu3GPUkhqZzWc.","verify_event":"","fp":"verify_mwbfnjqk_wXmWDfWS_JJPT_4x2U_80Zk_Ne7kZ0Rz1BHI","server_sdk_env":"{\"idc\":\"sinfonlinea\",\"region\":\"CN\",\"server_type\":\"whale\"}","log_id":"20261111092105062BC2D2731C1B1E0AF5","is_assist_mobile":false,"is_complex_sms":false,"identity_action":"","identity_scene":"","login_status":0,"aid":0}
     ```
   - **Đánh giá:** Endpoint lấy nội dung chương qua API bị chặn 100% bằng cơ chế `bdturing slide captcha` ở cấp WAF/Gateway với mọi client ẩn danh/không session hợp lệ.

2. **`GET /api/author/search/search_book/v1?...`**
   - **Status:** HTTP 200 OK
   - **Content-Length:** **0** (Body rỗng)
   - **Bdturing-Verify Header:** Kích hoạt `bdturing slide captcha` tương tự `reader/full`.
   - **Đánh giá:** Tính năng tìm kiếm qua Web API bị khóa chặt bởi bdturing.

---

### Mục d: Phân Tích Nội Dung SSR Web (`/reader/<itemId>`) & Mã Hóa Font PUA

Đã thực hiện kiểm tra sâu trên 3 chương khác nhau của bộ truyện `7069948840148732967` (tổng 351 chương, trong đó 341 chương có cờ `isChapterLock: true`):

| Chương | itemId | isChapterLock | needPay | Độ dài text | Ký tự PUA (E000–F8FF) | Ký tự CJK chuẩn | Tỷ lệ PUA/Tổng | Tỷ lệ PUA/CJK | Trạng thái nội dung |
|---|---|---|---|---|---|---|---|---|---|
| **Chương 1** (Miễn phí) | `7069952706521236001` | `false` | `0` | 5.079 ký tự | 2.243 | 1.413 | **44.2%** | **61.4%** | **Đầy đủ toàn bộ chương** |
| **Chương 11** (Khóa) | `7070467423643632159` | `true` | `0` | **200 ký tự** | 80 | 54 | **40.0%** | **59.7%** | **Bị cắt PREVIEW (chỉ 200 ký tự)** |
| **Chương 176** (Khóa) | `7145491757675840035` | `true` | `0` | **200 ký tự** | 82 | 75 | **41.0%** | **52.2%** | **Bị cắt PREVIEW (chỉ 200 ký tự)** |
| **Chương 1** (Tải lại lần 2) | `7069952706521236001` | `false` | `0` | 5.079 ký tự | 2.243 | 1.413 | **44.2%** | **61.4%** | **Đầy đủ toàn bộ chương** |

#### Phát Hiện Kiến Trúc Trọng Yếu:
1. **Hiện tượng Cắt Ngắn Xem Trước (Preview Truncation):**
   - Với các chương có `isChapterLock: false` (thường là 10 chương đầu của truyện), Web SSR trả về **đầy đủ 100% nội dung chương** trong `__INITIAL_STATE__.reader.chapterData.content`.
   - Với các chương có `isChapterLock: true` (chiếm đại đa số, ví dụ 341/351 chương = 97.1% số chương), Web SSR **CHỈ TRẢ VỀ ĐÚNG 200 KÝ TỰ ĐẦU TIÊN (PREVIEW)**.
   - **Hệ quả kỹ thuật:** Cho dù có giải mã được hoàn toàn font PUA, Web SSR **vẫn không thể cung cấp nội dung để đọc trọn vẹn truyện** nếu không có giải pháp vượt qua kiểm tra bản quyền/khóa chương của Fanqie (đòi hỏi app client hoặc giải captcha bdturing để gọi API `reader/full`).

2. **Cơ chế Mã hóa Font PUA (Private Use Area Font Obfuscation):**
   - Khoảng **60% số chữ Hán** trong nội dung được thay thế bằng các code point trong dải Unicode PUA (`U+E000` - `U+F8FF`).
   - File HTML nhúng font động qua CDN:
     `https://lf6-awef.bytetos.com/obj/awesome-font/c/dc027189e0ba4cd.woff2`
     (hoặc các biến thể font-weight `500`, `700`).
   - Khi tải lặp lại cùng một IP trong khoảng thời gian ngắn, mã hash font `dc027189e0ba4cd` giữ nguyên.
   - Tuy nhiên, trong header phản hồi API `x-tt-zhal`, ByteDance trả về các hash font khác nhau (`f=dc027189e0ba4cd`, `f=e26e946d8b2ccb7`...) cho thấy font map được luân chuyển động theo phiên hoặc theo cụm máy chủ CDN.
