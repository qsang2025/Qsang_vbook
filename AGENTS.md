# Qsang_vbook — Quy tắc nhà (AGENTS.md)

Repo extension vBook của Qsang. Branch mặc định: **`main`**.
Mọi URL registry (raw.githubusercontent.com) đều dùng branch `main`; `validate`
kiểm tra branch trong URL khớp branch thật của repo.

## 1. Làm việc với extension — bắt buộc dùng skill

Mọi việc tạo, sửa, test, kiểm tra (audit), refactor hay build/cài extension
đều phải đi qua skill **`.agents/skills/vbook-extensions`**:

1. Đọc kỹ `.agents/skills/vbook-extensions/SKILL.md` trước khi sửa extension.
2. Chỉ đọc đúng **một** file mode phù hợp trong
   `.agents/skills/vbook-extensions/modes/` (`create`, `fix`, `test`, `audit`,
   `refactor`).
3. Không tự suy diễn API vBook từ trí nhớ hay từ code cũ: hợp đồng chuẩn duy
   nhất là **`extension-api.md`** (xem mục 2).

## 2. Hợp đồng chuẩn duy nhất: extension-api.md

- Hợp đồng API vBook chỉ có **một** nội dung chuẩn, lưu ở **2 nơi giống hệt
  nhau**: `extension-api.md` và
  `.agents/skills/vbook-extensions/reference/extension-api.md`.
- Khi hợp đồng thay đổi: cập nhật **cả 2 bản**, kiểm tra 2 bản giống hệt nhau
  (so md5), rồi mới cập nhật skill và template.
- Không tạo bản hợp đồng thứ ba, không trích dẫn API từ nguồn khác.

## 3. Test / build / install — chỉ qua scripts/vbook.js

- Test, build và install extension **chỉ** qua
  `.agents/skills/vbook-extensions/scripts/vbook.js`
  (`connect` / `test` / `testall` / `build` / `install` qua developer server),
  theo đúng quy tắc kết nối và kiểm chứng trong skill.
- Không build zip bằng tay, không đóng gói bằng tool khác, không sửa tay
  trong file `plugin.zip`.
- Không suy ra quyền build / install / commit / push từ một yêu cầu chỉ hỏi
  review, viết tài liệu hay sửa source.

## 4. Nguồn sự thật duy nhất: src/

- `extensions/<loại>/<tên>/src/` trên đĩa là **nguồn sự thật duy nhất**.
- `plugin.zip` chỉ là artifact do build sinh ra từ `src/` — xem mục 8.
- Không sửa code trong zip; muốn sửa thì sửa `src/` rồi build lại.

## 5. Registry sinh tự động — không sửa tay

- `plugin.json` ở root (registry gốc) được **sinh tự động** bằng lệnh
  build-catalog từ các manifest `extensions/<loại>/<tên>/plugin.json`.
  **Không sửa tay `plugin.json` ở root.**
- Lệnh `validate` chạy **trước mỗi lần build**, bắt buộc kiểm tra:
  - catalog ≡ đĩa (mọi thư mục nguồn đều có trong catalog, mọi mục catalog
    đều có thư mục thật — không để nguồn mồ côi như Darkrai9x: 40/94 nguồn
    không có trong catalog);
  - mọi file JSON hợp lệ, không typo khóa (`locale` chứ không phải
    `locate`/`local`);
  - version trong manifest nguồn khớp version trong registry gốc;
  - branch trong URL registry là `main`, khớp branch thật của repo.

## 6. Quy tắc bắt buộc với mọi extension

1. **`src/` là nguồn sự thật duy nhất**; zip do CLI build, không sửa tay
   trong zip.
2. **Registry sinh tự động**; `validate` bắt catalog ≡ đĩa + JSON hợp lệ +
   version khớp trước mỗi lần build.
3. **Mọi nguồn mới phải có `config.js`** (không hardcode host/domain trong
   từng file script) và đủ vòng đời
   `home` / `genre` / `search` / `detail` / `toc` / `chap`
   (thêm `page` khi site có phân trang chương).
4. **Mọi file trong `src/` phải có trong script map** (manifest `script`);
   mọi script trong map phải tồn tại trên đĩa. File mồ côi thì xóa.
5. **Lỗi trả `Response.error` kèm thông báo tiếng Việt, không `return null`.**
6. **Locale chuẩn:** `vi_VN` / `zh_CN` / `ja_JP` / `en_US` / `zh_TW` — không dùng
   `vi-VN`, `ja`, `en`, `cn-CN` hay bất kỳ biến thể nào khác.
   **Type chuẩn** theo `extension-api.md` (`novel`, `chinese_novel`,
   `comic`, `video`, `audio`, `translate`, `tts`, `ai`) — không tự chế
   type như `eng_novel`, `jp_novel`.
7. **Không `encrypt: true` mặc định.** Source commit lên repo luôn phải đọc
   được. Chỉ mã hóa nguồn nào thật sự cần, và ghi rõ lý do.
   Không commit token / cookie / JWT / mật khẩu / secret thật (xem mục 7).
   Không đưa nội dung NSFW vào catalog chung; nếu sau này có thì tách
   manifest riêng / gắn `tag: "nsfw"`.
8. **Ưu tiên API chính thức** khi site có API; scrape HTML chỉ là phương án
   sau. Không dùng arrow function hay cú pháp JS hiện đại vượt giới hạn
   Rhino ES6 của runtime vBook.

## 7. Kỷ luật repo (sonzin)

- **Bump version ở cả 2 nơi** mỗi khi sửa một nguồn: manifest của nguồn đó
  (`extensions/<loại>/<tên>/plugin.json`) **và** registry gốc (`plugin.json`
  ở root — sinh lại bằng build-catalog, không sửa tay).
- **Rebuild `plugin.zip` sau mỗi thay đổi** trong `src/`; không để zip cũ
  lệch với source.
- Đóng gói bằng script chuyên dụng (`scripts/vbook.js` / `tools/cli`),
  không đóng zip bằng tay.
- **Không bao giờ commit token / cookie / JWT / mật khẩu thật**, kể cả trong
  ví dụ, comment hay file test. Config mẫu chỉ ghi tên trường, không ghi
  giá trị thật; cảnh báo rõ "không nhập mật khẩu vào plugin, dùng lại
  session trình duyệt".

## 8. plugin.zip là artifact — không commit zip

- `plugin.zip` do build sinh ra, **KHÔNG commit** (chỉ commit `src/` +
  `plugin.json` + `icon.png` + `test.json`).
- `.gitignore` chặn `*.zip` ở mọi nơi trong repo. Quyết định này cũng được
  ghi trong `README.md`.

## 9. Cơ chế lib-inline (lib/ chỉ là nguồn mẫu)

- Thư mục `lib/` ở root chỉ chứa **file mẫu dùng chung** (`cleanHtml.js`,
  `config-helpers.js`, `fetch-helpers.js`, `gbk.js`…).
- Runtime vBook: `load('file.js')` là text substitution **chỉ load file ở
  top level của `src/` trong cùng extension, không đệ quy**, file được load
  không được load thêm file khác. Vì vậy extension **không thể** load `lib/`
  ở root repo lúc chạy.
- Bước build **bắt buộc copy/inline** file lib cần thiết vào `src/` của từng
  extension trước khi đóng zip; `validate` kiểm tra zip đã chứa đủ file lib.
- Trong `src/`, file lib được copy vào vẫn phải tuân thủ mục 6.4: có mặt
  trong script map hoặc được `load()` từ một script đã khai báo — không để
  file lib mồ côi trong `src/`.

## 10. Mirror failover + golden fixture (điểm mới giai đoạn 1)

- `config.js` mẫu của mỗi nguồn chứa **danh sách mirror theo thứ tự ưu
  tiên**; helper `fetchWithFallback()` trong `lib/fetch-helpers.js` thử lần
  lượt các mirror và nhớ mirror nào đang chạy. Domain chính chết không đồng
  nghĩa extension chết.
- Mỗi nguồn có `test.json` (golden fixture): các case có kết quả kỳ vọng
  (vd. search từ khóa X phải trả về truyện Y; detail truyện Z phải có đúng
  N chương). `validate` kiểm tra fixture tồn tại và đúng định dạng; CI chạy
  fixture để phát hiện site đổi giao diện sớm.
- CI health-check hàng tuần chạy `validate` + `build` + kiểm tra fixture;
  kết quả sinh lại `STATUS.md` (xem file đó). `testall` trên thiết bị thật
  chỉ chạy khi chạy tay có cấu hình `VBOOK_SERVER` — CI không có điện thoại
  thì không chạy được `testall`.

## 11. Attribution / license

- Code mượn từ repo khác **giữ attribution**, không ghi tác giả Qsang cho
  code copy. Bảng attribution đầy đủ ở `README.md`.
- 32/33 repo tham khảo không có file LICENSE; chỉ `vbook_duongden` có —
  đọc `LICENSE` của duongden trước khi dùng bất kỳ phần nào từ đó.
- Không mang theo catalog NSFW hay code mã hóa của repo khác; chỉ mượn
  pattern code.
