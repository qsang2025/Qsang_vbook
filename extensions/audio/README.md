# audio — Nghe truyện / nhạc

**Chưa có extension nào.**

Thư mục này chứa các nguồn audio (nghe truyện, nhạc, ASMR…).

Mỗi nguồn là một thư mục con với: `icon.png` + `plugin.json` + `src/` + `test.json`
(`plugin.zip` do build sinh ra, không commit).

Script dùng cho loại này: `home.js`, `genre.js`, `search.js`, `detail.js`,
`toc.js` + `track.js` (danh sách track audio + phụ đề lrc/vtt nếu có).
Site bị chặn Cloudflare: fallback bằng `Engine.newBrowser` có guard
(xem `lib/fetch-helpers.js`).
Mọi nguồn phải có `src/config.js`. Xem `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
