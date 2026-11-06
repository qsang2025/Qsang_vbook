# tts — Đọc thành tiếng (Text-to-Speech)

**Chưa có extension nào.**

Thư mục này chứa các nguồn TTS (đọc truyện thành tiếng, ưu tiên tiếng Việt).

Mỗi nguồn là một thư mục con với: `icon.png` + `plugin.json` + `src/` + `test.json`
(`plugin.zip` do build sinh ra, commit kèm để app cài được từ URL repo).

Script dùng cho loại này: `home.js`, `genre.js`, `search.js`, `detail.js`,
`toc.js`, `chap.js` (+ script gọi API TTS).
Mọi nguồn phải có `src/config.js`. Xem `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
