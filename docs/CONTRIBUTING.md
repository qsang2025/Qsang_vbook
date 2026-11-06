# Đóng góp — Qsang_vbook

## Cách thêm nguồn mới

1. **Xin nguồn:** mở issue theo mẫu
   `.github/ISSUE_TEMPLATE/request_source.yml` (tên site, URL, loại truyện,
   có cần đăng nhập/trả phí không). Ai cũng có thể xin nguồn, không cần
   biết code.
2. **Tự làm nguồn:** đọc `AGENTS.md` (quy tắc nhà) → đọc skill
   `.agents/skills/vbook-extensions/SKILL.md` → scaffold từ
   `templates/<loại>/` → làm theo `docs/EXTENSION_DEVELOPMENT_GUIDE.md`
   → kiểm tra bằng `docs/verify-checklist.md` → gửi pull request.
3. Một PR chỉ thêm/sửa **một nguồn** (kèm `test.json` của nguồn đó) để
   review dễ. Không gộp nhiều nguồn vào một PR.

## Quy tắc attribution

- Code mượn từ repo khác phải **ghi rõ nguồn** (tên repo/tác giả gốc) trong
  README của nguồn hoặc trong bảng attribution ở `README.md` gốc.
- **Không ghi tác giả Qsang cho code copy.** Chỉ ghi Qsang cho phần mình
  tự viết.
- 32/33 repo tham khảo không có LICENSE; chỉ `vbook_duongden` có — đọc
  `LICENSE` của duongden trước khi dùng bất kỳ phần nào từ đó.
- Không mang theo catalog NSFW hay code mã hóa của repo khác.

## Không commit secret

- **Không bao giờ commit** token, cookie, JWT, mật khẩu, API key hay bất
  kỳ secret thật nào — kể cả trong ví dụ, comment, file test hay ảnh
  chụp màn hình.
- Config mẫu chỉ ghi tên trường, không ghi giá trị thật. Cảnh báo rõ
  "không nhập mật khẩu vào plugin, dùng lại session trình duyệt".
- Nếu lỡ commit secret: báo ngay cho maintainer để thu hồi secret đó
  (xóa commit không đủ — secret đã lộ phải coi như đã bị lộ).

## Quy tắc khác

- Branch mặc định là `main`; mọi URL registry dùng `main`.
- `plugin.json` gốc sinh tự động — không sửa tay. `plugin.zip` của nguồn
  được commit kèm (để app cài được từ URL repo); zip thử/zip tạm vẫn bị
  `.gitignore` chặn.
- Lỗi trả `Response.error` tiếng Việt, không `return null`. Locale chuẩn
  `vi_VN` / `zh_CN` / `ja_JP` / `en_US`. Không `encrypt: true` mặc định.
- Thảo luận bằng tiếng Việt. PR mô tả rõ: nguồn nào, site nào, đã chạy
  `validate`/`build`/`test` chưa, fixture pass hay chưa.
