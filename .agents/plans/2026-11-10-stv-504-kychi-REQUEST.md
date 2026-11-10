# Nhiệm vụ Nghiên cứu: Khảo sát Lỗi HTTP 504/502 trên 2 Extension Sáng Tác Việt và So sánh với [APP] Sáng Tác Việt của kychi

- **Mã nhiệm vụ:** `2026-11-10-stv-504-kychi`
- **Nhánh git:** `research/stv-504-kychi` (tách từ `origin/fix/stv-p1p2`)
- **Vai trò:** Recon Sub-agent (Bước 1 của skill `quota-workflow`)
- **Ngày thực hiện:** 2026-11-10

---

## 1. Bối cảnh & Mục tiêu

### 1.1. Bối cảnh
Người dùng app vBook trên điện thoại di động (Android/iOS) thường xuyên gặp phải lỗi **HTTP 504 Gateway Timeout** hoặc **HTTP 502 Bad Gateway** khi sử dụng 2 extension Sáng Tác Việt của repo `Qsang_vbook`:
1. `extensions/novel/sangtacviet` (phiên bản Web Parser v9).
2. `extensions/novel/sangtacvietapp` (phiên bản tối ưu Mobile App v4).

Đồng thời, cộng đồng vBook có phiên bản `[APP] Sáng Tác Việt` của tác giả **kychi** (`vbook-ext_kychitoge`). Cần đối chiếu hành vi, cấu hình, cơ chế bản quyền (License Server) và chiến lược xử lý lỗi / rate-limiting của kychi để tìm ra nguyên nhân gốc rễ và giải pháp khắc phục triệt để.

### 1.2. Mục tiêu nghiên cứu
1. Làm rõ nguyên nhân kỹ thuật gây ra HTTP 504/502 trên cả 4 tên miền của Sáng Tác Việt (`sangtacviet.app`, `sangtacviet.vip`, `sangtacviet.com`, `sangtacviet.pro`).
2. Giải thích vì sao người dùng mạng di động (4G/5G) hoặc đọc truyện vào các khung giờ cao điểm dễ gặp 504/502 hơn khi kiểm thử từ VM datacenter.
3. Làm rõ mã nguồn và cơ chế failover mirror hiện tại (I3 / I4) của 2 extension `sangtacviet` và `sangtacvietapp`, vì sao trước đây từng bị treo đến 138s.
4. Mổ xẻ extension `[APP] Sáng Tác Việt` của kychi: cấu hình `delay: 30000`, `thread_num: 1`, cơ chế License Key / Freemium, giải thích lỗi `"Lỗi parse dữ liệu từ License Server"`.
5. Đưa ra các giải pháp mitigation thực tế, an toàn, tuân thủ `AGENTS.md` (không mã hóa, không vi phạm Rhino ES6).

---

## 2. Ba Yêu cầu Nghiên cứu Cốt lõi

1. **Khảo sát mã nguồn 2 extension STV nội bộ (`sangtacviet` v9, `sangtacvietapp` v4):**
   - Cấu trúc `config.js`, `chap.js`, `detail.js`, `toc.js`.
   - Cơ chế mirror failover `fetchWithMirrors()`: điều kiện failover, việc dừng thử mirror khi đã nhận response 4xx/5xx (I3).
   - Cơ chế pacing & cooldown 405/429 (`rate-limit.js` - I4).
   - Đoạn mã cụ thể xử lý timeout / lỗi 504/502 và lý do tránh treo 138 giây.

2. **Khảo sát extension của kychi (`vbook-ext_kychitoge`):**
   - Phân tích `plugin.json` (metadata, source, `delay: 30000`, `thread_num: 1`, `LICENSE_KEY`, `CONFIG_URL`).
   - Cấu trúc file mã nguồn trong `plugin.zip`, trạng thái mã hóa (`encrypt: true`).
   - Phân tích cơ chế bản quyền / license server dẫn tới lỗi `"Lỗi parse dữ liệu từ License Server"`.

3. **Thực nghiệm Probe độc lập 4 domain STV:**
   - Kiểm tra IP, CDN (Cloudflare vs Direct Origin), Server header, TLS certificate.
   - Thử nghiệm gọi API `/io/searchtp/searchBooks`, `/mobile/bookinfo.php` với Plain headers vs App headers.
   - Đo latency và đánh giá cấu trúc hạ tầng máy chủ backend.

---

## 3. Ràng buộc & Tiêu chí Hoàn thành (Definition of Done)

### Ràng buộc
- **TUYỆT ĐỐI KHÔNG sửa mã nguồn extension** trong đợt nghiên cứu này (giữ nguyên working tree sạch).
- **TUYỆT ĐỐI KHÔNG merge lên `main`**.
- Mọi tài liệu và ghi chép kỹ thuật phải lưu vào `.agents/plans/` và `work/ext-review/`.

### Definition of Done (DoD)
- [x] Tạo nhánh `research/stv-504-kychi` từ `origin/fix/stv-p1p2`.
- [x] Tạo file ghi nhận yêu cầu: `.agents/plans/2026-11-10-stv-504-kychi-REQUEST.md`.
- [x] Thực hiện đầy đủ các bước khảo sát mã nguồn, kychi và probe độc lập 4 domain.
- [x] Hoàn thành tài liệu tổng hợp chuyên sâu: `.agents/plans/stv-504-kychi-CONTEXT.md`.
- [x] Báo cáo chi tiết và gửi tin nhắn hoàn tất về cho Planner / Master Agent.
