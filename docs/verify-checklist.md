# Checklist kiểm tra trước khi thêm nguồn mới

Chạy checklist này cho **mỗi nguồn mới** trước khi đưa vào catalog
(`plugin.json` gốc). Đánh dấu từng mục; chỉ merge khi tất cả đều pass.
Mục nào không áp dụng thì ghi rõ lý do, không bỏ qua im lặng.

## Manifest & JSON

- [ ] `extensions/<loại>/<tên>/plugin.json` parse được (JSON hợp lệ, không
      typo khóa — `locale` chứ không phải `locate`/`local`).
- [ ] Manifest có đủ: `metadata` (name, author, version, source, regexp,
      description, locale, type, `language: "javascript"`) và `script`.
- [ ] `version` trong manifest nguồn **khớp** version của nguồn đó trong
      registry gốc (sau khi chạy build-catalog).
- [ ] `locale` chuẩn: `vi_VN` / `zh_CN` / `ja_JP` / `en_US` — không
      `vi-VN`, `ja`, `en`, `cn-CN`.
- [ ] `type` chuẩn theo `extension-api.md` (`novel`, `chinese_novel`,
      `comic`, `video`, `audio`, `translate`, `tts`, `ai`) — không tự chế
      type (`eng_novel`, `jp_novel`…).
- [ ] `regexp` phủ đúng domain nguồn (kèm các mirror đã biết), không sai
      chính tả (vd. thiếu `h` trong `https`).
- [ ] `source` là URL thật của site, không phải `localhost`, IP LAN hay
      đường dẫn Windows.

## Script map & file

- [ ] Mọi file trong `src/` đều có trong script map; mọi script trong map
      đều tồn tại trên đĩa (không file mồ côi, không khai báo thiếu file).
- [ ] Đủ vòng đời: `home` / `genre` / `search` / `detail` / `toc` / `chap`
      (+ `page` khi site có phân trang chương).
- [ ] Mỗi file JS có đúng một `function execute(...)`.
- [ ] Mọi script đều `load('config.js')` ở dòng đầu; **không hardcode host**
      trong từng file script.
- [ ] `src/config.js` có `BASE_URL` + danh sách mirror dự phòng.
- [ ] File lib cần thiết đã được copy/inline vào `src/` (lib-inline) và
      `validate` xác nhận zip chứa đủ file lib.
- [ ] **Không arrow function**, không cú pháp JS hiện đại vượt giới hạn
      Rhino ES6.
- [ ] Không `encrypt: true` (trừ khi có lý do ghi rõ và được duyệt).

## Hành vi & lỗi

- [ ] Lỗi trả `Response.error` kèm thông báo **tiếng Việt**; không chỗ nào
      `return null` khi lỗi.
- [ ] `search` trả về đúng truyện khi tìm từ khóa mẫu; `detail` có đủ
      metadata; `toc` liệt kê đủ chương; `chap` trả nội dung sạch (đã qua
      `cleanHtml`, không còn dòng rác / HTML thừa).
- [ ] Phân trang không tự trỏ về trang đầu (kiểm tra `nextPageToken`).
- [ ] Ưu tiên API chính thức khi site có API; scrape HTML chỉ khi không
      có API.

## Fixture (golden test)

- [ ] Có `test.json` với ít nhất 1 case search và 1 case detail có kết quả
      kỳ vọng (tên truyện, số chương tối thiểu…).
- [ ] `validate` xác nhận fixture tồn tại và đúng định dạng.
- [ ] Fixture pass khi chạy trên app thật (hoặc ghi rõ chưa test được vì
      lý do gì).

## Bảo mật & pháp lý

- [ ] Không commit token / cookie / JWT / mật khẩu / secret thật — kể cả
      trong ví dụ, comment hay `test.json`.
- [ ] Không hardcode proxy IP/token, Telegram token hay thông tin tài khoản.
- [ ] Không đưa nội dung NSFW vào catalog chung.
- [ ] Attribution: nếu code mượn từ repo khác, ghi rõ nguồn trong README
      của nguồn (hoặc bảng attribution ở README gốc); không ghi tác giả
      Qsang cho code copy.

## Build & catalog

- [ ] Đã chạy `validate` — pass, không cảnh báo tồn đọng.
- [ ] Đã chạy `build` bằng `scripts/vbook.js` — `plugin.zip` mới sinh ra
      từ `src/` hiện tại.
- [ ] Đã bump version ở **cả** manifest nguồn **và** registry gốc.
- [ ] Đã chạy build-catalog để sinh lại `plugin.json` gốc — không sửa tay
      registry.
- [ ] `plugin.zip` đã commit kèm và khớp với `src/` hiện tại (để app
      cài được từ URL repo).
- [ ] `STATUS.md` sẽ được CI cập nhật — không sửa tay trạng thái nguồn.
