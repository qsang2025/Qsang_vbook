# ai — AI

**Chưa có extension nào.**

Thư mục này chứa các nguồn AI (tóm tắt, gợi ý, trò chuyện… gắn với truyện).

Mỗi nguồn là một thư mục con với: `icon.png` + `plugin.json` + `src/` + `test.json`
(`plugin.zip` do build sinh ra, không commit).

Script dùng cho loại này: `home.js`, `search.js`, `detail.js`, `chap.js`
(tùy theo tính năng AI của nguồn; khai báo đủ trong script map).
Mọi nguồn phải có `src/config.js`. Không commit API key / token thật.
Xem `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
