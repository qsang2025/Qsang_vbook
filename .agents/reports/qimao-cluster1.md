# Báo cáo Cụm bước 1: Khởi tạo khung sườn, Manifest và Thư viện mã hóa

- **Thời gian hoàn thành**: 2026-11-09
- **Nhánh thực hiện**: `feature/qimao-ag` (Repo: `/home/antigravity/qsang2025/Qsang_vbook`)
- **Tác giả quy định**: `"author": "MuseAi"`
- **Trạng thái**: **HOÀN THÀNH (100% Cụm bước 1)**

---

## 1. Kết quả thực hiện chi tiết

1. **Step 0: Plan savepoint**
   - Đã commit file kế hoạch `.agents/plans/2026-11-09-qimao-extension.md` và các tài liệu liên quan vào nhánh `feature/qimao-ag`.
   - Commit hash: `3bbdc02`.
   - Message: `docs: initialize plan for qimao extension (feature/qimao-ag)`.

2. **Step 1: Tạo thư mục và `plugin.json`**
   - Thư mục: `extensions/chinese_novel/qimao/`.
   - `plugin.json`:
     - Tác giả: `"author": "MuseAi"`
     - Phiên bản: `1`
     - Loại: `"type": "chinese_novel"`
     - Locale: `"locale": "zh_CN"`
     - Regexp: `"^https?:\\/\\/(www\\.)?qimao\\.com\\/shuku\\/\\d+\\/?$"`
     - Script map: Đầy đủ 7 script (`home`, `genre`, `gen`, `search`, `detail`, `toc`, `chap`).
   - Đã đặt `icon.png` chính thức (PNG 88x88 RGBA).
   - JSON parse: Hợp lệ 100%.

3. **Step 2: Tạo `src/config.js` và inline `src/crypto.js`**
   - `src/config.js`:
     - Khai báo đầy đủ hằng số domain và endpoint: `BASE_URL`, `API_BC_URL`, `API_KS_URL`, `API_SALT`.
     - Hàm `signQuery(queryStr)`: ghép param với muối bảo mật `API_SALT = "d3dGiJc651gSQ8w1"` và băm MD5.
     - Hàm `buildHeaders()`: sinh app headers Android chuẩn kèm chữ ký MD5.
     - Helper `cleanText()`.
     - **Tuyệt đối không chứa lệnh `load()`** (tuân thủ triệt để Rule 1 Rhino ES6).
   - Inline thư viện `lib/crypto.js` vào `extensions/chinese_novel/qimao/src/crypto.js`. Đã kiểm thử tính năng MD5 và giải mã AES-128-CBC thành công.
   - Đã chạy linter Rhino ES6 trên cả `config.js` và `crypto.js`: **0 cảnh báo / 0 lỗi cú pháp**.

4. **Kế hoạch tiếp theo (Cụm bước 2)**:
   - Triển khai các script Điều hướng: `home.js`, `genre.js`, `gen.js`, `search.js`.
