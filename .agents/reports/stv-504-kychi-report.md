# Sub-agent Report: Nghiên Cứu Lỗi HTTP 504 Sáng Tác Việt & So Sánh Với Extension kychi

- **Mã nhiệm vụ:** `2026-11-10-stv-504-kychi`
- **Người thực hiện:** Sub-agent (Flash Model)
- **Nhánh Git:** `research/stv-504-kychi`
- **Thời gian hoàn thành:** 2026-11-10 05:26 UTC (12:26 Giờ Hà Nội)
- **File báo cáo chính:** `work/ext-review/STV-504-KYCHI-AG.md` (399 dòng, 6 phần hoàn chỉnh)

---

## 1. Kết Quả Thực Hiện

1. **Step 0 (Savepoint & Git tracking):**
   - Đã commit các file kế hoạch (`.agents/plans/2026-11-10-stv-504-kychi-REQUEST.md`, `.agents/plans/2026-11-10-stv-504-kychi.md`, `.agents/plans/stv-504-kychi-CONTEXT.md`) tại commit `be92838`.
2. **Step 1 (Soạn thảo Báo cáo chuyên sâu `work/ext-review/STV-504-KYCHI-AG.md`):**
   - Đã soạn thảo đầy đủ tài liệu 6 phần giải mã bản chất sự cố 504, phân tích thực nghiệm probe 4 domain STV, cơ chế worker exhaustion / realtime crawl, giải phẫu DRM Freemium và lỗi License Server của kychi, kiểm chứng 3 giả thuyết kỹ thuật và đề xuất giải pháp kỹ thuật cụ thể.
   - Cam kết: `git diff --stat extensions/` hoàn toàn rỗng (0 dòng code bị sửa đổi trong `extensions/`).
3. **Step 2 (Commit & Push Remote):**
   - Đã commit `work/ext-review/STV-504-KYCHI-AG.md` tại commit `edff77a`.
   - Đã push thành công lên GitHub remote: `origin/research/stv-504-kychi`.

---

## 2. Tóm Tắt Các Phát Hiện & Kết Luận Cốt Lõi

1. **Hạ tầng mạng 4 domain STV:**
   - Cả 4 domain (`.app`, `.vip`, `.com`, `.pro`) đều trỏ về **chính xác 1 IP backend duy nhất: `103.82.20.93`** (Nginx 1.18.0 trên Ubuntu tại CloudFly VNPT Hanoi).
   - `.app` và `.vip` bọc qua Cloudflare CDN (Edge SIN). `.com` và `.pro` kết nối trực tiếp vào Nginx origin.
2. **Bản chất lỗi 504:**
   - Do backend PHP-FPM của STV bị kiệt sức worker khi cào realtime + dịch VietPhrase từ các site nguồn Trung Quốc (Faloo, Qidian, 69shu...).
   - Tính thời điểm (504 lúc 11:18 nhưng 11:19 hết) là đặc trưng của Micro-burst khi hàng đợi Nginx/PHP-FPM được giải phóng.
   - Thiết bị di động tại Việt Nam dùng mạng 4G/5G CGNAT dễ chạm trần timeout do độ trễ định tuyến và bị Cloudflare giám sát lưu lượng tập trung.
3. **Lỗi của extension kychi:**
   - `"Lỗi parse dữ liệu từ License Server"` xảy ra ở `chap.js` do kychi cài cắm mô hình Freemium (50 chương/ngày) phụ thuộc vào License Server bên thứ 3 của cá nhân tác giả. Khi server này lỗi hoặc trả về HTML, `JSON.parse` thất bại và chặn đứng việc đọc truyện dù STV vẫn sống.
   - Cấu hình `delay: 30000` của kychi chỉ áp dụng khi tải offline (`thread_num: 1`), hoàn toàn vô hiệu khi đọc trực tiếp.
4. **Khuyến nghị cho Qsang_vbook:**
   - Áp dụng cơ chế **Smart Quick-Retry**: Nếu gặp 502/504, nghỉ 2-3s và thử lại tối đa 1 lần duy nhất sang `https://sangtacviet.pro` (timeout 5s) thay vì lặp qua 4 mirror gây treo 138s.
   - Tách biệt Cooldown: Chỉ áp dụng Cooldown dài (30-60m) cho mã 405/429 (WAF block); tuyệt đối không cooldown 60m với 504 (chỉ áp dụng micro-cooldown 15-30s).
   - Chuẩn hóa thông báo lỗi tiếng Việt thân thiện, hướng dẫn người dùng chuyển sang `.pro` trong cài đặt.
