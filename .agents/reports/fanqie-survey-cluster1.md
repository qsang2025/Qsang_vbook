# Báo Cáo Tiến Độ Sub-Agent (Flash) — Cụm 1: Khảo Sát fanqienovel.com

- **Mã công việc:** `2026-11-11-fanqie-survey`
- **Nhánh:** `research/fanqie-survey`
- **Trạng thái Cụm 1:** HOÀN THÀNH (DONE)
- **Các commit đã tạo:**
  1. `aa122c4`: `docs(fanqie): survey plan` (Step 0)
  2. `242a7f5`: `docs(fanqie): request and context documents (step 1)` (Step 1)
  3. `71cfcf2`: `docs(fanqie): live probe logs and progress (step 2, cluster 1 complete)` (Step 2)

---

## 1. Các Việc Đã Làm
1. **Step 0:** Đã commit file kế hoạch gốc `.agents/plans/2026-11-11-fanqie-survey.md` lên nhánh `research/fanqie-survey`.
2. **Step 1:**
   - Tạo `.agents/plans/2026-11-11-fanqie-survey-REQUEST.md`: Ghi rõ Goal, ranh giới 4 điểm tuyệt đối không vi phạm, và tiêu chuẩn hoàn thành DoD.
   - Tạo `.agents/plans/fanqie-survey-CONTEXT.md`: Hệ thống hóa facts kiểm chứng ban đầu từ Master, các quy tắc AGENTS.md (Rhino ES6, pacing, static home.js), và trích dẫn chuẩn API vBook (`extension-api.md`) về `Engine.newBrowser()`, `localCookie`, `chap.js`, `download_links`.
3. **Step 2:**
   - Dùng script bóc tách bundle JS frontend (`muye_f9eb17e2.js`) để xác định đúng danh sách tham số của các Web API.
   - Chạy bộ live probe tự động (pacing 3.5s/request, UA Chrome tiêu chuẩn, không token/cookie, tuần tự) kiểm tra 11 endpoint và 4 lượt tải chương đọc truyện.
   - Lưu trữ toàn bộ kết quả kiểm thử định lượng tại `work/ext-review/fanqie-probe-log.md`.
   - Cập nhật mục `Progress` trong file plan.

---

## 2. Bằng Chứng & Phát Hiện Trọng Yếu Từ Live Probe
1. **Discovery / Metadata / TOC Hoàn Toàn Khả Thi Qua Web API (Không bị bdturing):**
   - `/api/author/book/category_list/v0/`: HTTP 200, trả về cây danh mục đầy đủ (48 KB JSON). Thích hợp làm `genre.js`.
   - `/api/rank/recommend/list`: HTTP 200, trả về bảng xếp hạng truyện đề xuất kèm ảnh bìa, mô tả (8.7 KB JSON). Thích hợp cho `home.js`.
   - `/api/author/misc/top_book_list/v1/`: HTTP 200, trả về danh sách top truyện (12 KB JSON).
   - `/api/book/info?bookId=...`: HTTP 200, trả về metadata chi tiết truyện.
   - `/api/reader/directory/detail?bookId=...` và `POST /api/reader/directory/list`: HTTP 200, trả về danh mục toàn bộ chương (itemId, title, volume, isChapterLock, needPay). Thích hợp làm `toc.js`.
2. **Hai Nút Thắt An Ninh (Choke Points):**
   - **Choke Point 1 — Search API:** Cả `/api/author/search/search_book/v1` và `/search/page` đều không trả về kết quả tìm kiếm cho anonymous client (API trả về HTTP 200 rỗng + header `bdturing-verify` yêu cầu slide captcha).
   - **Choke Point 2 — Full Reader API:** `/api/reader/full?itemId=...` trả về HTTP 200 rỗng + header `bdturing-verify: {"subtype":"slide",...}`.
3. **Cơ Chế Khóa Chương (Truncation) & Mã Hóa Font PUA Trên Web SSR:**
   - **Tỷ lệ mã hóa PUA:** ~41-44% tổng ký tự (tương đương ~60% toàn bộ chữ Hán) bị thay bằng ký tự dải Unicode PUA (`U+E000` - `U+F8FF`), hiển thị qua web font động `dc027189e0ba4cd.woff2`.
   - **Khóa nội dung chương:**
     - Chương miễn phí (`isChapterLock: false`, chương 1): Web SSR trả về **100% nội dung chương** (5.079 ký tự).
     - Chương khóa (`isChapterLock: true`, từ chương 11 trở đi, chiếm 97% số chương): Web SSR **CHỈ TRẢ VỀ PREVIEW 200 KÝ TỰ**.
     - **Kết luận kiến trúc:** Giải pháp bóc tách Web SSR thuần túy (dù có giải mã font) **chỉ đọc được ~10 chương đầu** của mỗi bộ truyện. Muốn đọc tiếp bắt buộc phải có session đã xác thực hoặc vượt qua cơ chế bảo vệ của Fanqie.

---

## 3. Vấn Đề Mở Cho Cụm 2 & Cụm 3
1. Đối với H2 (Hiển thị HTML + font gốc trực tiếp trong vBook): Trình đọc vBook tiêu chuẩn render text native, không chạy full CSS web engine tải font từ URL ngoài. Cần đối chiếu kỹ năng lực của `Engine.newBrowser()` hoặc `download_links` (mở browser in-app của vBook).
2. Đối với H3 (Tái sử dụng session người dùng tự giải captcha trong browser vBook): vBook có cookie jar tự động và `localCookie.setCookie`/`getCookie`, nhưng liệu cookie session của webview có được chia sẻ sang HTTP fetch engine không?
3. Đối với H8 (Extension Metadata-only + Điều hướng mở app/web): Đây là hướng an toàn 100%, bền vững nhất, tận dụng hoàn hảo các API Category, Rank, Book Info, TOC đang mở.
