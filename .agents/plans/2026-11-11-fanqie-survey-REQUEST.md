# Yêu cầu Khảo sát Toàn diện Nguồn fanqienovel.com (番茄小说)

- **Mã công việc (Task ID):** `2026-11-11-fanqie-survey`
- **Kho lưu trữ:** `/home/antigravity/qsang2025/Qsang_vbook`
- **Nhánh làm việc:** `research/fanqie-survey` (tách từ `origin/main`)
- **Tài liệu bàn giao (Deliverable):** `work/ext-review/FANQIE-SURVEY-AG.md`
- **Người phê duyệt:** anh Sáng (đã duyệt phạm vi, ranh giới và bổ sung Plan B ngày 2026-11-11)

---

## 1. Mục tiêu (Goal)
Lập báo cáo khảo sát kỹ thuật toàn diện, khách quan và chuyên nghiệp về nguồn `fanqienovel.com` (番茄小说 — nền tảng tiểu thuyết miễn phí của ByteDance). Báo cáo phân tích và kiểm chứng mọi hướng giải pháp kỹ thuật có thể để đọc truyện fanqie trên ứng dụng vBook, lập ma trận chấm điểm từng hướng theo các tiêu chí (tính khả thi, độ bền, trải nghiệm người dùng, rủi ro pháp lý/ToS, tính tương thích với runtime Rhino ES6), và đưa ra khuyến nghị thực tế cuối cùng.

**Lưu ý tuyệt đối:**
- KHÔNG chỉnh sửa bất kỳ file nào trong thư mục `extensions/`.
- KHÔNG merge hay push trực tiếp vào nhánh `main`.

---

## 2. Ranh giới Bắt buộc (Mandatory Boundaries)
Theo thỏa thuận ranh giới đã được duyệt ngày 2026-11-11, các hạng mục sau **CHỈ được phân tích dựa trên tài liệu, mã nguồn mở công khai (README, issue, blog kỹ thuật)**, mô tả ở mức độ kiến trúc/khái niệm, đánh giá ưu/nhược và chấm điểm — **TUYỆT ĐỐI KHÔNG viết PoC, không viết script khai thác, không chạy thử**:
1. **Không giải/vượt/tự động hóa captcha slide `bdturing` (SecSDK ByteDance).**
2. **Không giả lập thuật toán ký app di động của ByteDance** (`X-Gorgon`, `X-Argus`, `X-Khronos`, `X-Ladon`, spoof `device_id`/`iid`).
3. **Không giải mã font PUA bằng phân tích vector glyph hoặc OCR.** Không tải và không sử dụng bảng mã font mapping / charset cộng đồng để can thiệp nội dung.
4. **Không gọi hoặc tích hợp máy chủ proxy / server trung gian bên thứ ba** (ví dụ các IP/domain không chính thức như `101.35.133.34:5000`, `api.cengui.cn`...).

**Quy tắc đo kiểm mạng trực tiếp (Live Probe):**
- Chỉ gửi request HTTP thông thường, không đăng nhập, không dùng token/header bất thường.
- Pacing request: tốc độ tối đa 1 request / 3 giây (sleep ≥ 3s giữa các lần gọi).
- Dùng User-Agent trình duyệt thông thường.
- Nếu gặp HTTP `403`, `405`, hoặc `429`, dừng ngay việc probe endpoint đó, ghi nhận lại log và phân tích nguyên nhân.

---

## 3. Tiêu chuẩn Hoàn thành (Definition of Done - DoD)
1. Báo cáo `work/ext-review/FANQIE-SURVEY-AG.md` hoàn thành đầy đủ 6 phần:
   - Phần 1: Tóm tắt điều hành & Khuyến nghị cốt lõi.
   - Phần 2: Bản đồ kiến trúc & Hạ tầng phòng thủ của Fanqie (Tengine WAF, SecSDK/bdturing, PUA font encryption, API gateway).
   - Phần 3: Ma trận endpoint khảo sát trực tiếp (URL, method, response status, headers, body format, bdturing gating, độ tin cậy).
   - Phần 4: Ma trận phân tích 9 hướng giải pháp (H1–H9: SSR metadata, HTML+font render tại app, Browser session reuse, App gateway, Font decode, Bdturing bypass, Third-party proxy, Metadata-only + official app link, Plan B nguồn thay thế). Mỗi hướng có: cơ chế, ưu, nhược, độ bền, rủi ro, tính khả thi Rhino/vBook, điểm đánh giá 1-5, và trạng thái minh bạch ("đã thử" / "chỉ phân tích theo ranh giới").
   - Phần 5: Khuyến nghị lộ trình & Điều kiện xem xét lại trong tương lai.
   - Phần 6: Phụ lục log kiểm thử thực tế và tài liệu tham khảo.
2. Kiểm tra tính toàn vẹn:
   - `git diff --stat origin/main..HEAD -- extensions/` hoàn toàn rỗng.
   - `npm run validate` chạy thành công (PASS).
   - Nhánh `research/fanqie-survey` được push lên GitHub với đầy đủ các commit theo từng cụm.
