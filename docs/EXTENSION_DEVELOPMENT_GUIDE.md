# Hướng dẫn phát triển extension — Qsang_vbook

Tài liệu ngắn gọn theo đúng khung sườn repo này. Hợp đồng API đầy đủ xem
`extension-api.md` (cùng thư mục `docs/`) — đó là tài liệu chuẩn duy nhất;
file này chỉ tóm tắt cách làm việc, không thay thế hợp đồng.

## 1. Vòng đời script

Một extension = `plugin.json` (manifest) + `icon.png` + `src/*.js` → build
thành `plugin.zip`. Mỗi file JS có đúng **một** `function execute(...)`,
trả `Response.success(items, next)` hoặc `Response.error(...)`.

Thứ tự chạy trong app:

```
home / genre  →  search  →  detail  →  (page)  →  toc  →  chap
```

| Script | Nhiệm vụ |
|---|---|
| `home.js` | Trang chủ: danh sách truyện nổi bật / mới cập nhật. |
| `genre.js` | Duyệt theo thể loại. |
| `search.js` | Tìm kiếm theo từ khóa. |
| `detail.js` | Thông tin truyện + metadata (tác giả, trạng thái, mô tả…). |
| `page.js` | Phân trang chương (khi site chia chương thành nhiều trang). |
| `toc.js` | Mục lục: danh sách chương. |
| `chap.js` | Nội dung một chương. |

- `src/` trên đĩa là nguồn sự thật duy nhất; zip do build sinh ra.
- Mọi file trong `src/` phải có trong script map của manifest; mọi script
  trong map phải tồn tại. File mồ côi thì xóa.
- Lỗi trả `Response.error` kèm thông báo **tiếng Việt**, không `return null`.
- Không dùng arrow function hay cú pháp JS hiện đại vượt giới hạn Rhino ES6.
- Locale chuẩn: `vi_VN` / `zh_CN` / `ja_JP` / `en_US`. Type chuẩn theo
  `extension-api.md`: `novel`, `chinese_novel`, `comic`, `video`, `audio`,
  `translate`, `tts`, `ai`.

## 2. config.js — bắt buộc với mọi nguồn

Mọi nguồn phải có `src/config.js`, được `load('config.js')` ở dòng đầu mỗi
script. `config.js` chứa:

- `BASE_URL` + danh sách mirror dự phòng theo thứ tự ưu tiên;
- override `DOMAIN` / `CONFIG_URL` khi cần;
- hằng số riêng của nguồn (selector chính, page size…).

**Không hardcode host/domain trong từng file script.** Muốn đổi domain thì
chỉ sửa `config.js`.

## 3. lib-inline — thư viện dùng chung

- `lib/` ở root repo chỉ là **nguồn mẫu**: `cleanHtml.js`,
  `config-helpers.js` (`normalizeUrl`, `absUrl`, `cleanText`, `storyItem`,
  `nextPageToken`), `fetch-helpers.js` (`fetchWithFallback`,
  fallback `Engine.newBrowser` có guard), `gbk.js` (web Trung).
- Runtime vBook: `load('file.js')` chỉ load file ở **top level của `src/`**
  trong cùng extension, không đệ quy. Extension **không thể** load `lib/`
  ở root lúc chạy.
- Vì vậy bước **build bắt buộc copy/inline** file lib cần thiết vào `src/`
  của từng extension trước khi đóng zip; `validate` kiểm tra zip đã chứa
  đủ file lib.
- Ưu tiên API chính thức khi site có API; scrape HTML là phương án sau.
- `chap.js` mẫu theo lequang0996: retry 3 lần (mobile UA + Referer +
  backoff), lọc dòng rác, 2 chiến lược trích xuất (cắt chuỗi thô trước,
  fallback 13 selector chọn kết quả dài nhất), log chẩn đoán.

## 4. Mirror failover

- `config.js` liệt kê mirror theo thứ tự ưu tiên (domain chính trước,
  mirror sau).
- Helper `fetchWithFallback()` trong `lib/fetch-helpers.js` thử lần lượt
  các mirror, nhớ mirror nào đang chạy để lần sau thử nó trước.
- Regexp trong manifest nên phủ các mirror đã biết (mẫu SPRINGPEACH: một
  regexp đa domain thay vì tách 3 nguồn trùng nhau).
- Domain chính chết **không** đồng nghĩa extension chết — chỉ khi mọi
  mirror đều chết mới đánh dấu UNREACHABLE trong `STATUS.md`.

## 5. Golden fixture (test.json)

Mỗi nguồn có `test.json` với các case có **kết quả kỳ vọng**:

```json
{
  "search": [
    { "keyword": "tên truyện", "expectFirst": "Tên truyện đúng" }
  ],
  "detail": [
    { "url": "https://.../truyen-x/", "expectMinChapters": 10 }
  ]
}
```

- `validate` kiểm tra fixture tồn tại và đúng định dạng.
- CI chạy fixture hàng ngày để phát hiện site đổi giao diện sớm.
- Fixture chỉ chứa dữ liệu công khai (tên truyện, URL công khai) — không
  chứa token, cookie hay tài khoản.

## 6. Validate / build / catalog

```
validate   # catalog ≡ đĩa, JSON hợp lệ, version khớp, fixture đúng định dạng
build      # copy lib vào src/ → đóng plugin.zip → sinh lại registry
test       # chạy thử trên app thật qua developer server (scripts/vbook.js)
testall    # chạy toàn bộ nguồn — chỉ khi có thiết bị thật (VBOOK_SERVER)
```

- `validate` chạy **trước mỗi lần build**.
- `plugin.json` ở root sinh tự động bằng build-catalog — **không sửa tay**.
- Bump version ở cả manifest nguồn và registry gốc sau mỗi thay đổi; rebuild
  `plugin.zip` sau mỗi thay đổi trong `src/`.
- `plugin.zip` do build sinh ra, **commit kèm** với nguồn để app cài
  được từ URL repo (chỉ commit `plugin.zip` của nguồn, không commit
  zip thử/zip tạm).

## 7. Checklist trước khi đưa nguồn vào catalog

Xem `verify-checklist.md`. Tóm tắt: JSON hợp lệ, version khớp 2 nơi,
script map khớp file trên đĩa, locale/type chuẩn, fixture pass, không arrow
function, không hardcode host, không secret, lỗi trả `Response.error`
tiếng Việt.
