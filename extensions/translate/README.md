# translate — Dịch truyện

**Chưa có extension nào.**

Thư mục này chứa các nguồn dịch truyện (vd. dịch truyện Trung sang tiếng Việt).

Mỗi nguồn là một thư mục con với: `icon.png` + `plugin.json` + `src/` + `test.json`
(`plugin.zip` do build sinh ra, commit kèm để app cài được từ URL repo).

Script dùng cho loại này: `home.js`, `genre.js`, `search.js`, `detail.js`,
`toc.js`, `chap.js` (+ script dịch chương, chia chunk khi gọi API dịch).
Mọi nguồn phải có `src/config.js`. Xem `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
