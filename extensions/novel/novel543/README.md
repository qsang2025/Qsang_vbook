# 稷下書院 (novel543.com)

Extension vBook cho **novel543.com — 稷下書院** (Jixia Academy), site truyện chữ
**tiếng Trung phồn thể** (zh_TW) đọc full text miễn phí, nội dung HTML SSR tĩnh.

## 1. Site (khảo sát 2026-11-10)

| Hạng mục | Chi tiết |
|---|---|
| Trang chủ | `https://www.novel543.com/` — 301 từ novel543.com |
| Truyện mẫu | HP訓狗指南 `/0609709217/` (132 chương, 連載, tác giả 愛吃榴皮煲雞湯的木三, thể loại 其他) |
| Sách lớn đã kiểm tra | 離婚後她驚艷了世界 `/0419223983/` (4.091 chương, 連載) |
| Detail | OG meta đầy đủ (book_name, author, category, status, update_time, latest_chapter_name) + DOM fallback (h1.title, .cover img, p.meta, .intro) |
| TOC | `/<book>/dir` — **1 trang duy nhất kể cả 4.091 chương**, không phân trang. Link chương `/<book>/<vol>_<seq>.html`; phải lọc pattern + dedupe + **sort theo (vol, seq) tăng dần** mới đúng thứ tự đọc (trang xếp lạ: 12 mới nhất trước rồi archive) |
| Chương | `div.chapter-content > div.content.py-5 > p`; chương chia nhiều trang: tiêu đề `(x/y)`, trang phụ `_<n>.html` (vd `8096_1_2.html`); lọc đoạn rác "溫馨提示:...", "設置", "繁體简体" |
| Tìm kiếm | `GET /search/<từ khóa URL-encoded>`; kết quả `li.media` như trang thể loại |
| Thể loại | 13 mục: 玄幻, 修真, 都市, 歷史, 網遊, 科幻, 女頻, 靈異, 同人, 軍事, 懸疑, 穿越, 其它 — `/bookstack/<slug>/`, 18 truyện/trang, phân trang `?page=N` |
| Xếp hạng | `/ranking.html` + `/ranking/0-8-8001.html` 大熱榜, 8002 新書榜, 8003 完結榜, 8004 收藏榜, 8005 更新榜; `0-2-*` nữ / `1-2-*` nam; 30 truyện/trang |
| Cloudflare | Fronted. Từ VM: homepage/detail/dir/chap HTTP 200; **riêng `/search/` trả trang challenge "Just a moment..." (HTTP 403)**. search.js có browser fallback (fetchDocWithFallback) + `fetchWithChallengeHandler` trả lỗi tiếng Việt có hướng dẫn qua challenge trong trình duyệt của app. Trên máy thật (IP di động) có thể không bị challenge |

## 2. Extension

- Thư mục `extensions/novel/novel543/`, type `novel`, locale `zh_TW`, v1, author `MuseAi`.
- Scripts: `home.js` (8 tab tĩnh → book.js), `genre.js` (13 thể loại → book.js),
  `book.js` (parser `li.media` chung, token trang kế = link pager "»"),
  `search.js` (`/search/<kw>`, xử lý redirect về detail khi khớp đúng 1 truyện),
  `detail.js` (OG ưu tiên + DOM fallback, genres → book.js, suggests = mục 編輯推薦),
  `toc.js` (lọc + dedupe + sort (vol, seq)), `chap.js` (gộp các trang `_<n>.html`).
- Lib dùng chung (copy vào `src/`, md5 khớp root `lib/`): `config.js`,
  `config-helpers.js`, `fetch-helpers.js`, `cleanHtml.js`, `rate-limit.js`
  (gọi `rateLimitDelay()` trước mỗi fetch — pacing quy tắc 11),
  `challenge-handler.js` (chỉ search.js dùng, cho đường /search/ bị challenge).
- Không có chương VIP (không thấy VIP/付費/訂閱/鎖定 trên detail/toc/chap đã kiểm tra).
- Icon: favicon 32×32 của site upscale PIL LANCZOS lên 200×200 (không có logo lớn hơn).

## 3. Test

Xem `test.json` (7 case: detail/toc/chap/search/genre/home/book).
Chạy qua CLI một cửa `scripts/cli.js` (xem AGENTS.md §3).

## 4. Ghi chú

- `og:novel:latest_chapter_url` dùng dạng ngắn `/<book>/<seq>.html` — toc.js không dùng
  URL này mà dùng link trong `.chaplist` (đầy đủ `<vol>_<seq>`).
- Trang thể loại / ranking đổi nội dung theo ngày: nếu case `book.js` trong test.json
  hỏng vì tên truyện đầu trang đổi, cập nhật tên theo trang hiện tại.
- Nếu tìm kiếm trên máy vẫn bị Cloudflare challenge: mở `https://www.novel543.com/search/`
  trong trình duyệt của app, qua challenge 1 lần để cookie chung có hiệu lực
  (kinh nghiệm novels.com.tw), rồi thử lại trong extension.
