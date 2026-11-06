# chinese_novel — Truyện Trung

**Chưa có extension nào.**

Thư mục này chứa các nguồn truyện Trung (đọc raw hoặc qua dịch máy).

Mỗi nguồn là một thư mục con với: `icon.png` + `plugin.json` + `src/` + `test.json`
(`plugin.zip` do build sinh ra, không commit).

Script dùng cho loại này: `home.js`, `genre.js`, `search.js`, `detail.js`,
`toc.js`, `chap.js` (+ `page.js` khi site có phân trang chương).
Lưu ý web Trung: dùng `response.html('gbk')` khi site dùng encoding GBK và
helper `lib/gbk.js`; tách xử lý URL tương đối / tuyệt đối.
Mọi nguồn phải có `src/config.js`. Xem `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
