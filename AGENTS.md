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

## 3. Test / build / install — chỉ qua CLI một cửa scripts/cli.js

- Test, build và install extension **chỉ** qua CLI một cửa
  `scripts/cli.js` — điều phối xuống `tools/cli/*` và
  `.agents/skills/vbook-extensions/scripts/vbook.js`
  (`connect` / `test` / `testall` / `build` / `install` qua developer server),
  theo đúng quy tắc kết nối và kiểm chứng trong skill.
- `build` chạy offline bằng bộ zip local (không cần điện thoại);
  `test` / `testall` / `install` vẫn qua developer server.
- Không build zip bằng tay, không đóng gói bằng tool khác, không sửa tay
  trong file `plugin.zip`.
- Không suy ra quyền build / install / commit / push từ một yêu cầu chỉ hỏi
  review, viết tài liệu hay sửa source.

## 4. Nguồn sự thật duy nhất: src/

- `extensions/<loại>/<tên>/src/` trên đĩa là **nguồn sự thật duy nhất**.
- `plugin.zip` do build sinh ra từ `src/` và **được commit kèm** để app
  cài được từ URL repo — xem mục 8.
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
  - branch trong URL registry là `main`, khớp branch thật của repo;
  - **linter Rhino ES6** quét `src/*.js` và `lib/*.js`: cấm arrow function,
    async/await, template literal, `?.`, `??`, spread, `.flat()` (runtime
    vBook chỉ chạy Rhino ES6); kiểm tra `function execute(...)` tồn tại
    trong mỗi script và file được `load()` không `load()` thêm file khác
    (load không đệ quy — xem mục 9). Từ 2026-11-09, `validate` còn chạy
    `node --check` cho mọi file `src/*.js` và `lib/*.js` (bắt lỗi cú pháp JS
    thật — lỗi thừa dấu `}` ở tiemtruyenchu v4 từng lọt qua validate) và
    kiểm tra md5 của file lib đã inline trong `src/` khớp bản gốc ở `lib/`
    (drift fetch-helpers.js từng lệch 9/10 ext).

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
9. **`home.js` chỉ trả tab tĩnh, không fetch.** App chạy tab đầu tiên ngay khi mở extension — fetch lỗi ở đó sẽ chặn cả trang chủ. Tab trỏ về `book.js` / `search.js` với input là đường dẫn danh sách (`/nosort/...`, `/quanben/nosort/...`) để list script tải dữ liệu; không parse mục trang chủ `/` trong tab đầu tiên. (Bài học novels.com.tw 2026-11-06: v1 fetch trang chủ `/` nên lỗi ngay ở ngoài, trong khi tab tĩnh trỏ về `/nosort/` chạy bình thường.)
10. **Không xoay User-Agent mặc định.** Fetch dùng UA mặc định của runtime để cookie `cf_clearance` của Cloudflare còn hiệu lực (Cloudflare gắn cookie với UA của trình duyệt đã qua xác minh). Chỉ xoay UA khi một site cụ thể chứng minh là cần, và không bao giờ xoay trên site sau Cloudflare challenge. (Bài học novels.com.tw 2026-11-06: xoay UA bị 403 ngay cả khi đã qua xác minh trong trình duyệt của app; extension của mizhm dùng UA mặc định thì chạy được.)
11. **Pacing request chống rate-limit (bài học qimao 405, 2026-11-09).** 1 request/lần/host, gọi `rateLimitDelay()` (lib/rate-limit.js) trước mỗi request, không request song song trên cùng host; muốn mã HTTP thì dùng `pacedFetch()` thay cho `fetchPage()` (trả về `{ok, status, res, ...}` để phân biệt 405 với lỗi mạng). Gặp 429/405/503 thì backoff hàm mũ + jitter tối đa 3 lần rồi dừng; gặp 405/429 thì ghi cooldown (`setCooldown`) và KHÔNG dùng browser fallback (cùng IP, vô ích). Lỗi trả về phải nói rõ "đang tạm chặn, thử lại sau X phút" (xem `rateLimitErrorMessage`). Test trên máy: 1 request/lần, cách nhau ≥ 2–3 giây với host nhạy cảm. (Bài học qimao.com 2026-11-09: ~6–10 request nhanh, có 2 song song, khiến WAF chặn IP bằng HTTP 405 hơn 2 giờ; API host wtzw.com không bị chặn.)

## 7. Kỷ luật repo (sonzin)

- **Bump version ở cả 2 nơi** mỗi khi sửa một nguồn: manifest của nguồn đó
  (`extensions/<loại>/<tên>/plugin.json`) **và** registry gốc (`plugin.json`
  ở root — sinh lại bằng build-catalog, không sửa tay).
- **Rebuild `plugin.zip` sau mỗi thay đổi** trong `src/`; không để zip cũ
  lệch với source.
- Đóng gói bằng CLI một cửa (`scripts/cli.js`),
  không đóng zip bằng tay.
- **Không bao giờ commit token / cookie / JWT / mật khẩu thật**, kể cả trong
  ví dụ, comment hay file test. Config mẫu chỉ ghi tên trường, không ghi
  giá trị thật; cảnh báo rõ "không nhập mật khẩu vào plugin, dùng lại
  session trình duyệt".

## 8. plugin.zip — commit kèm để app cài được từ URL repo

- `plugin.zip` do build sinh ra từ `src/`, **được commit kèm** với nguồn
  (quyết định của Anh ngày 2026-11-06; trước đó zip không commit). Lý do:
  registry trỏ tới
  `raw.githubusercontent.com/.../extensions/<loại>/<tên>/plugin.zip` nên
  app vBook chỉ cài được khi zip có mặt trên GitHub.
- `.gitignore` chặn `*.zip` nhưng chừa `extensions/**/plugin.zip`.
- Sau mỗi thay đổi trong `src/` phải **rebuild zip ngay**; `validate`
  kiểm tra mỗi nguồn đều có `plugin.zip` và nội dung zip khớp `src/`
  hiện tại (plugin.json + src/*.js + file lib đã inline).
- Không commit file .zip nào khác (zip thử, zip tạm).

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

## 10. Mirror failover + fixture + health-check hàng ngày

- `config.js` mẫu của mỗi nguồn chứa **danh sách mirror theo thứ tự ưu
  tiên**; helper `fetchWithFallback()` trong `lib/fetch-helpers.js` thử lần
  lượt các mirror và nhớ mirror nào đang chạy. Domain chính chết không đồng
  nghĩa extension chết.
- Hai loại fixture, **không trộn lẫn nhau**:
  - `test.json` (golden fixture): case theo từng script
    (`{script, input, expect: {contains, minItems}}`) để test trên thiết bị
    thật qua developer server.
  - `health.json` (fixture nhẹ): `{"cases": [{"name"?, "url", "pattern"?}]}`
    để CI probe kiểm tra site còn sống / giao diện còn khớp mà không cần điện
    thoại (chỉ fetch HTTP + so pattern trên mẫu body).
  `validate` kiểm tra cả hai file tồn tại và đúng định dạng.
- CI health-check **hàng ngày (00:00 UTC)** chạy `validate` (+ linter) +
  `build` + probe sức khỏe từng nguồn từ `health.json`; kết quả sinh lại
  `STATUS.md` (xem file đó). `testall` trên thiết bị thật chỉ chạy khi chạy
  tay có cấu hình `VBOOK_SERVER` — CI không có điện thoại thì không chạy
  được `testall`.

## 11. Attribution / license

- **Định dạng Tác giả (`author`) chuẩn duy nhất**: Luôn để thống nhất `"author": "MuseAi"`. **Tuyệt đối KHÔNG ghi `MuseAi (ref: ...)` hay bất kỳ biến thể nào vào trường `author`** để đảm bảo tính năng filter/lọc extension theo tác giả trong app vBook hoạt động chính xác. Mọi thông tin ghi nhận công lao, tham khảo tác giả khác (`ref: ...`) bắt buộc chuyển xuống trường `description` của extension.
- Code mượn từ repo khác **giữ attribution**, không ghi tác giả MuseAi cho
  code copy. Bảng attribution đầy đủ ở `README.md`.
- 32/33 repo tham khảo không có file LICENSE; chỉ `vbook_duongden` có —
  đọc `LICENSE` của duongden trước khi dùng bất kỳ phần nào từ đó.
- Không mang theo catalog NSFW hay code mã hóa của repo khác; chỉ mượn
  pattern code.
- Repo này dùng **MIT License** (file `LICENSE` ở root, copyright Dương
  Nguyễn Quốc Sáng, 2026 — Anh chốt ngày 2026-11-06). Ghi tên license ở
  `package.json` / `README.md` phải khớp với file LICENSE thật này.

## 12. Health-check probe + fixture nhẹ (giai đoạn 1)

- `scripts/health-check.js` probe sức khỏe các nguồn **không cần điện thoại**:
  HTTP GET tới `metadata.source`, đo latency, theo redirect (tối đa 5),
  kiểm tra các case trong `health.json` của nguồn. Trạng thái: `HEALTHY` /
  `MOVED` / `DEGRADED` / `BROKEN` / `NO_SOURCE` / `UNKNOWN` / `BLOCKED`.
- `BLOCKED` = HTTP 403: site chặn truy cập từ IP của CI (tường lửa Cloudflare
  chặn dải IP datacenter của GitHub Actions — đã xác minh 2026-11-06: cùng
  request từ máy này trả 200, từ runner GitHub trả 403). BLOCKED còn gồm
  trường hợp site/WAF cắt TLS handshake của probe Node (đã gặp ở biquge.tw
  và truyenfull.link ngày 2026-11-07 — curl với UA trình duyệt trả 200,
  máy thật đọc bình thường, chỉ stack TLS của Node bị từ chối). Cả hai đều
  không kết luận được site sống hay chết nên **không tính là gãy**: BLOCKED
  vẫn ghi vào `health-check-failures.json` nhưng không tính vào `failedCount`
  (job auto-issue không mở issue sai); thấy BLOCKED thì kiểm tra tay bằng
  trình duyệt/máy thật.
- Redirect sang origin khác (đổi domain) hoặc kẹt ở 3xx được phân loại
  `MOVED`, **không** tính là HEALTHY. Lỗi mạng/5xx được thử lại 1 lần; mỗi
  lần thử có hard timeout 10s (bao cả kẹt DNS/connect).
- Probe ghi `health-check-failures.json` (dùng nội bộ trong workflow, đã
  gitignore) và **exit 1 khi có nguồn không HEALTHY**. Probe không ghi
  `STATUS.md` — file đó do job `status` trong workflow sinh.
- `health.json` là **fixture nhẹ cho CI** — khác `test.json` (fixture sâu
  theo từng script, chỉ chạy được trên máy thật qua developer server).
  Định dạng: `{"cases": [{"name"?, "url", "pattern"?}]}` (chấp nhận cả mảng
  trần). Mỗi case GET `url` rồi tìm `pattern` (regex, không phân biệt
  hoa/thường) trong body (mẫu tối đa 512KB). `pattern` tùy chọn — không có
  thì chỉ kiểm tra HTTP 200. `validate` kiểm tra `health.json` đúng định
  dạng; probe báo `DEGRADED` khi case lỗi hoặc pattern không thấy.
- Linter Rhino ES6 nằm trong `tools/cli/validate.js`: cấm arrow function,
  async/await, template literal, `?.`, `??`, spread, `.flat()` trong
  `src/*.js` và `lib/*.js`; script chạy được phải có `function execute(...)`;
  file được `load()` không được `load()` tiếp. Linter bỏ qua `load('...')`
  nằm trong comment/chuỗi (chỉ tính lệnh thật). Từ 2026-11-09, `validate`
  còn chạy `node --check` cho mọi file `src/*.js` và `lib/*.js` và kiểm tra
  md5 file lib đã inline trong `src/` khớp bản gốc ở `lib/` (xem mục 5).
- Workflow `validate.yml` chạy mỗi push/PR vào main (`validate` +
  `build-catalog --check` + `git diff --exit-code plugin.json`).
- Workflow `health-check.yml` chạy **hàng ngày 00:00 UTC** + chạy tay.
  Job `validate-build` chạy probe (nguồn gãy không fail job). Job
  `auto-issue` mở issue GitHub khi có nguồn gãy, **chống trùng theo tiêu đề**
  cố định `[Health-check] Có nguồn vBook bị lỗi / đổi giao diện` (chỉ mở
  khi chưa có issue mở cùng tiêu đề).

## 13. Điều phối tác vụ lớn tiết kiệm quota (`quota-workflow`)

- Với các tác vụ lớn (ước tính **> 30 phút** hoặc có **≥ 3 bước phụ thuộc**,
  ví dụ tạo/sửa nhiều nguồn cùng lúc hoặc đại tu lớn) hoặc khi người dùng yêu
  cầu áp dụng `quota-workflow`, bắt buộc đọc và tuân thủ skill
  **`quota-workflow`** (đã cài sẵn trong danh sách skill của Antigravity — gọi
  `lookup_skill(skill_name: "quota-workflow")`, hoặc đọc từ
  `https://github.com/qsang2025/antigravity-skills/tree/main/quota-workflow`).
- **Quy tắc phân vai & chọn model (được người dùng cấp quyền cố định tại đây):**
  - **Master (Planner / Decision-maker):** Chạy trên model mạnh của phiên chính
    (`Gemini 4 Argon Medium`, tier `pro`), chỉ dùng cho việc lập Plan (1 turn)
    và ra quyết định khi sub-agent báo cáo về.
  - **Sub-agent (Recon / Executor):** Bắt buộc gọi `invoke_subagent` với đầy đủ
    3 tham số tường minh:
    `TypeName: "self"`, `Workspace: "inherit"`, `Model: "flash"`
    (`Gemini 3.8 Flash Medium`). Tuyệt đối không dùng `TypeName: "research"` cho
    bước khảo sát mạng/ghi file và không bỏ trống `Model`.
  - **Bước 1 + 1.5 (Recon):** Gộp thành **1 lần gọi sub-agent `flash` duy nhất**
    để ghi `<date>-<task>-REQUEST.md` và `<task>-CONTEXT.md`.
  - **Bước 2 + 3 (Plan & Review):** Master viết trọn vẹn file Plan
    (`<date>-<task>.md`) bằng 1 lần gọi `write_to_file`, tự rà Checklist và
    dispatch luôn sub-agent `flash` thực thi cụm bước đầu tiên trong **cùng 1
    turn** (sub-agent đầu tiên sẽ commit file Plan ở Step 0).
  - **Kỷ luật Git & Lưu tiến độ:** Chỉ chạy **tuần tự 1 sub-agent ghi file tại
    một thời điểm** trên cùng repo; không merge `.agents/plans/` và
    `.agents/reports/` vào nhánh `main`; nếu hết quota ở bất kỳ bước nào thì lưu
    tiến độ vào file Plan, commit và dừng lại báo cáo ngay (không lặp lại).

