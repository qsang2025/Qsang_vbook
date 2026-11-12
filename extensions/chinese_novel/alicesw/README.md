# alicesw (爱丽丝书屋)

Extension đọc truyện chữ tiếng Trung trên alicesw.com (port từ alicesw v5
của hieu05, fork yae-miko-313).

## Điểm đặc biệt của site (đã kiểm chứng live 2026-11-12)

- **Chỉ trả nội dung cho UA mobile** — UA desktop nhận template gần như
  rỗng (trang chi tiết không có `.detail-box`, `.jianjie`; đếm = 0). Mọi
  request đều gửi UA mobile iPhone cố định (ngoại lệ có bằng chứng theo
  quy tắc nhà 6.10; ngược với Tadu — nơi chỉ UA desktop mới có SSR).
- **Domain không www 301 về www** — `BASE_URL` là `https://www.alicesw.com`.
- **URL chi tiết là `/novel/<id>.html`**; URL chương là
  `/book/<id-nội-bộ>/<hash>.html` (id nội bộ khác id novel — chỉ dùng
  href có sẵn, không tự suy ra).
- **Mục lục không phân trang** — `/other/chapters/id/<id>.html` trả toàn bộ
  chương trong 1 trang (truyện 477 chương vẫn 1 trang).
- **Trang thể loại không có ảnh bìa** — item danh sách không gửi cover
  (không dùng ảnh placeholder như bản gốc).
- **Bình luận 2 bước** — GET trang lists chỉ cho `var trre=[{id,mid,type}]`
  (danh sách id, không có nội dung); phải POST chunk id tới
  `home/comment/tree` mới nhận HTML bình luận. Bản gốc đọc sai chỗ này
  nên trả bình luận rỗng.
- Tìm kiếm `/search.html?q=&p=` — 10 kết quả/trang, có phân trang (下一页).

## Sửa so với bản gốc

- Mọi `return null` → `Response.error` tiếng Việt; tìm kiếm 0 kết quả →
  danh sách rỗng (không báo lỗi); next token chỉ đặt khi có nút 下一页.
- `config.js` viết lại theo chuẩn nhà (DOMAIN inject qua try/catch thay
  cho `CONFIG_URL` không tồn tại) + `fetchPage()` có pacing
  (`rateLimitDelay`) + UA mobile.
- `detail.js`: trích id truyện robust (`/novel/(\d+)\.html`); bỏ cover
  placeholder postimg, dùng ảnh bìa thật (img.321cdn.com).
- Xóa `gener.js` (bản sao chết của home.js, không có trong script map).
- Mọi file trong `src/` đều có trong script map; thêm `rate-limit.js` và
  `safe-first.js` (lib dùng chung, md5 khớp bản gốc).
- `author` = `MuseAi` theo quy tắc nhà §11; attribution gốc giữ trong
  description.

## Nguồn

- Site: https://www.alicesw.com — truyện chữ tiếng Trung, có nội dung
  người lớn nên manifest gắn `nsfw: true`.
- Truyện mẫu test: 换爱家族 (44787, 連載, 477 chương) và
  末日：收留无家可归的少女和美妇 (53577, 已完结, 162 chương).
