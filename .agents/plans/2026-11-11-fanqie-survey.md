# Plan: Khảo sát toàn diện nguồn fanqienovel.com (番茄小说)

- Task ID: `2026-11-11-fanqie-survey`
- Repo: /home/antigravity/qsang2025/Qsang_vbook — branch `research/fanqie-survey` (tách từ origin/main)
- Sản phẩm: `work/ext-review/FANQIE-SURVEY-AG.md`
- Người duyệt: anh Sáng (đã duyệt phạm vi + ranh giới ngày 2026-11-11)

## 1. Goal
Báo cáo khảo sát chuyên nghiệp liệt kê MỌI hướng giải pháp để đọc fanqie trên vBook, chấm điểm từng hướng, khuyến nghị cuối. KHÔNG sửa `extensions/`, KHÔNG push/merge `main`.

### Ranh giới bắt buộc (anh Sáng đã đồng ý)
Các hướng sau CHỈ phân tích bằng nguồn công khai (README/blog có sẵn), mô tả mức khái niệm, chấm điểm — KHÔNG viết PoC/code chạy được, KHÔNG thực thi:
1. Giải/vượt/tự động hoá slide captcha `bdturing` (SecSDK).
2. Giả chữ ký app ByteDance (`X-Gorgon`, `X-Argus`, `X-Khronos`, device_id/iid giả).
3. Giải mã font PUA bằng đối chiếu glyph/OCR; KHÔNG tải và dùng bảng tra charset cộng đồng để giải mã nội dung.
4. Gọi/đưa vào extension server trung gian bên thứ ba (vd. `101.35.133.34:5000`, `api.cengui.cn`) — KHÔNG gửi request tới các server này.
Probe live: chỉ request ẩn danh thường, ≤ 1 request / 3 giây, tuần tự, không đăng nhập, không token lạ.

## 2. Context (facts đã kiểm chứng bởi master, 2026-11-11 00:43–00:52 UTC, từ VM)
- `GET https://fanqienovel.com/` → 200 (Tengine, CDN ByteDance, CSP liệt kê *.snssdk.com, *.bytetos.com, *.fqnovelstatic.com).
- `GET /page/<bookId>` (vd 7069948840148732967) → 200, SSR `window.__INITIAL_STATE__` có `page.chapterListWithVolume`/itemIds, tác giả, ảnh bìa.
- `GET /reader/<itemId>` (vd 7069952706521236001) → 200, SSR `__INITIAL_STATE__.reader.chapterData` có `title`, `needPay:0`, `content` HTML `<p>..</p>`; 5077 ký tự, 2113 ký tự PUA U+E400–U+E5FF (41.6% tổng, ~60% số chữ Hán); `common.css` khai báo @font-face động `https://lf6-awef.bytetos.com/obj/awesome-font/c/<hash>.woff2`. Parse: JSON nằm giữa `__INITIAL_STATE__=` và `;\n            }\n        )(`.
- `GET /api/reader/full?itemId=...` → 200, content-length 0, header `bdturing-verify` {"subtype":"slide"...}.
- `GET /api/author/search/search_book/v1?...query_word=剑来` → 200, rỗng + `bdturing-verify`.
- `GET /search/page?...` → 200 nhưng CSR (`searchBookList:null`).
- `GET /api/book/info?bookId=...` → 200 JSON đầy đủ (bookName, author, abstract, thumbUrl, wordNumber, lastChapterTitle, categoryV2...).
- `GET /api/reader/directory/detail?bookId=...` → 200 JSON (itemId, title, needPay, isChapterLock, volume_name, realChapterOrder).
- `m.fanqienovel.com` → 502. `novel.snssdk.com/api/novel/book/directory/list/v1/` → 200 rỗng (có/không UA app). `api5-normal-c-lf.fqnovel.com` → không resolve từ proxy VM.
- Bundle `//lf-fe.fqnovelstatic.com/obj/novel-fanqie-fe/toutiao/muye/js/muye_f9eb17e2.js` chứa danh sách API: /api/book/info, /api/reader/directory/{detail,list,iid}, /api/reader/full, /api/author/library/book_list/v0/, /api/author/book/category_list/v0/, /api/rank/{category/list,recommend/list,recent/update/list}, /api/author/misc/top_book_list/v1/, /api/library/book_list, /api/comment/get_book_comment, /api/author/search/search_book/v1, ...
- Nguồn công khai tham khảo (chỉ đọc README, không chạy): zwb8926/fanqie-novel (Open VSX — thừa nhận /api/reader/full bị bdturing ở IP datacenter, dùng server bên thứ ba, search fallback novel.snssdk.com), naiyQAQ/fanqie-assistant, ying-ck/fanqienovel-downloader, yunmegnze/fanqie-novel-downloader-skill (Chrome CDP + charset), pattoneirc/fanqie-font-decode, zhoulianglen/fanqiexiaoshuo-Download.
- Project rules: AGENTS.md repo (Rhino ES6, home.js tĩnh, config.js, pacing 6.11, không secret, author MuseAi), extension-api.md là hợp đồng duy nhất (đọc để đánh giá khả năng WebView/Engine.newBrowser, cookie/session).

## 3. Execution steps

### Cụm 1 (1 sub-agent flash)
- **Step 0** — Commit plan: `git add .agents/plans/ && git commit -m "docs(fanqie): survey plan"` trên `research/fanqie-survey`. Verify: `git log -1`.
- **Step 1** — Viết `.agents/plans/2026-11-11-fanqie-survey-REQUEST.md` (goal, ranh giới, DoD) và `.agents/plans/fanqie-survey-CONTEXT.md` (tóm tắt mục 2 + quy tắc AGENTS.md liên quan + đoạn extension-api.md về browser/WebView/cookie/localCookie/Engine). Commit.
- **Step 2** — Probe live bổ sung (tuần tự, sleep 3s giữa request, UA trình duyệt thường), lưu log thô vào `work/ext-review/fanqie-probe-log.md`:
  a. `/api/author/library/book_list/v0/`, `/api/author/book/category_list/v0/`, `/api/rank/category/list`, `/api/rank/recommend/list`, `/api/author/misc/top_book_list/v1/`, `/api/library/book_list` — thử tham số hợp lý suy từ bundle (đọc bundle để lấy tên tham số); ghi status, length, có bdturing không, mẫu 300 ký tự.
  b. `/api/reader/directory/list?bookId=...`, `/api/comment/get_book_comment?bookId=...`.
  c. Xác nhận lại `reader/full` và `search_book` (1 lần mỗi cái).
  d. Kiểm tra 2–3 chương khác nhau (cả chương có `isChapterLock:true`) xem SSR trả nội dung đầy đủ hay preview, đo tỷ lệ PUA; kiểm tra hash font có đổi giữa các lần tải không (chỉ so URL, KHÔNG tải/parse font).
  Verify: log có đủ mục a–d. Commit + cập nhật Progress.

### Cụm 2 (1 sub-agent flash)
- **Step 3** — Đọc extension-api.md: xác định vBook có cách nào hiển thị HTML+@font-face của trang gốc cho người dùng (vd Engine.newBrowser / browser.html / trả HTML có style) để chữ PUA render đúng tại máy người dùng mà extension không giải mã; ghi kết luận có trích dẫn dòng. Cũng xác định cơ chế dùng lại session trình duyệt (localCookie/cookie) của vBook.
- **Step 4** — Đọc README các dự án công khai (mục 2) qua google_browse; tóm tắt cơ chế mỗi dự án, ngày cập nhật, tình trạng sống/chết; KHÔNG chạy code, KHÔNG gọi server bên thứ ba.
- **Step 5** — Plan B: tìm nguồn hợp lệ thay thế cho cùng loại nội dung (vd fanqie có đăng trên nền tảng đối tác/xuất bản; đầu truyện tương đương trên Qimao đã có extension qimao-ag). Chỉ tìm kiếm + ghi chú.
  Commit + Progress sau mỗi step.

### Cụm 3 (1 sub-agent flash)
- **Step 6** — Viết `work/ext-review/FANQIE-SURVEY-AG.md` theo khung: (1) Tóm tắt + khuyến nghị; (2) Bản đồ hạ tầng; (3) Ma trận endpoint đo được (bảng); (4) Ma trận giải pháp H1–H9 — mỗi hướng: cơ chế, ưu, nhược, độ bền, rủi ro ToS/pháp lý, khả thi Rhino/vBook, điểm 1–5, trạng thái (“đã thử”/“chỉ phân tích” + lý do ranh giới):
  H1 SSR metadata+TOC; H2 hiển thị HTML+font gốc trong vBook (render tại máy); H3 dùng lại session trình duyệt người dùng tự qua xác minh; H4 gateway app snssdk; H5 giải mã font; H6 vượt bdturing; H7 server bên thứ ba; H8 extension metadata-only + mở web/app chính thức; H9 Plan B nguồn thay thế. (5) Khuyến nghị + điều kiện xem lại; (6) Phụ lục log + nguồn.
- **Step 7** — Verify: `git diff --stat origin/main..HEAD -- extensions/` rỗng; `npm run validate` PASS. Commit, `git push -u origin research/fanqie-survey`. Viết `.agents/reports/fanqie-survey-final.md` + 1 dòng `.agents/reports/INBOX.md`.

## 4. Risks & fallbacks
- Rate-limit/WAF fanqie: ≤1 req/3s; nếu gặp 403/405/429 → dừng probe, ghi lại, không retry.
- Hết quota flash giữa cụm → cập nhật Progress, commit, dừng, báo master.
- Ngờ vực ranh giới (một bước có vẻ cần vượt rào) → KHÔNG làm, ghi "chỉ phân tích", báo master.
- Push bị từ chối → `git pull --rebase` 1 lần rồi push lại; không force.

## 5. Definition of Done
- Báo cáo đủ 6 phần, H1–H9 đều có điểm + lý do; mọi số liệu có lệnh/URL tái lập.
- `extensions/` không đổi; validate PASS; nhánh đã push; main không đụng.

## Progress
- [x] Master: plan viết 2026-11-11 01:15 UTC.
- [ ] Cụm 1 (Step 0–2)
  - [x] Step 0: Commit plan (commit aa122c4)
  - [x] Step 1: REQUEST.md + CONTEXT.md
  - [ ] Step 2: Live probe bổ sung + log
- [ ] Cụm 2 (Step 3–5)
- [ ] Cụm 3 (Step 6–7)

## Decisions
- 2026-11-11: anh Sáng duyệt ranh giới 4 điểm + thêm Plan B.
- Gộp Recon vào Cụm 1 (master đã có đủ facts từ probe trực tiếp) để tiết kiệm 1 turn master.
