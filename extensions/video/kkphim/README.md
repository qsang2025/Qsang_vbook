# KKPhim — video extension (kkphim.com qua API phimapi.com)

## Nguồn

- Site hiển thị: https://kkphim.com — kho phim tổng hợp (hoạt hình, phim bộ, phim lẻ).
- Dữ liệu: API JSON công khai https://phimapi.com, không cần đăng nhập.
  - Danh sách: `/v1/api/danh-sach/hoat-hinh?category=<slug>&page=N` (24 phim/trang;
    tổng 3642 phim hoạt hình, 152 trang — kiểm chứng 21/11).
  - Thể loại: `/v1/api/the-loai` (26 loại; loại `phim-18` bị loại khỏi catalog).
  - Chi tiết: `/phim/<slug>` → `{data:{item:{...}}}`.
  - Tìm kiếm: `/v1/api/tim-kiem?keyword=<q>&page=N`.
- Mẫu kiểm chứng 21/11:
  - "Đại Chúa Tể 3D" — 1 server Vietsub, 100 tập (tổng 104); tập 1
    `https://s6.kkphimplayer6.com/20260415/GmMlD1tc/index.m3u8`.
  - "Pháp Sư Tử Linh: Ta Chính Là Thiên Tai" — phim mới đầu list hoat-hinh,
    37 tập; tập 1 `https://v7.kkphimplayer7.com/20260725/eHRIPHPf/index.m3u8`.

## Điểm khác với hoathinh3d (cùng API phimapi.com)

- **Hình dạng response chi tiết đã đổi:** API nay trả `{data:{item:{...}}}`,
  không còn `{movie, episodes}` ở top level như tài liệu cũ của hoathinh3d
  (README hoathinh3d dòng 24). KKPhim đọc `data.item`; hoathinh3d có thể
  đã gãy ở detail/toc/chap với hình dạng mới này — cần kiểm tra riêng,
  không thuộc phạm vi task này.
- **Không lọc country:** hoathinh3d chỉ lấy `country=trung-quoc` (donghua TQ);
  KKPhim lấy toàn bộ kho hoạt hình (mọi quốc gia).
- **Pacing:** mỗi request gọi `rateLimitDelay()` trước (quy tắc 11 AGENTS.md);
  hoathinh3d chưa có.
- **track.js không bao giờ trả type "auto":** chỉ native (.m3u8/.mp4) hoặc
  `Response.error` tiếng Việt. chap.js chỉ đưa link_m3u8 vào track.

## Kiểm chứng phát thật

- Link .m3u8 trả 404 từ VM (CDN chặn IP egress của VM — cùng mẫu 404 908 byte
  với phim1280.tv/kvp726.com). Probe từ ĐIỆN THOẠI Anh 21/11 09:51:
  cả 2 link mẫu (s6 + v7) trả **LIVE 200** — link không chết, build bình thường.
  Log: `work/ext-review/video-phone-probe-2026-11-21.log`.
- Cửa ải cuối là device test trên máy Anh + Anh bấm Play xác nhận hình chạy.

## Vòng đời

home (6 tab tĩnh) → search (từ khóa / list path) → detail → toc → chap
(1 mục/server, data = link_m3u8) → track (native + Referer phimapi.com/).
