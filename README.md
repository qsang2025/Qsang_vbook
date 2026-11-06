# Qsang_vbook

Tuyển tập extension vBook của Qsang: đọc truyện chữ, truyện tranh, video,
audio, dịch, TTS và AI — viết theo một khung sườn thống nhất, có kiểm tra tự
động, mỗi nguồn đều có fixture kiểm thử.

> **Repo hiện có 2 extension** (xem [Catalog](#catalog)):
> **App Truyện Chữ** (novel, v3) và **HHKUNGFU** (video, v1).
> Khung sườn đã xong; nguồn mới được tạo từ template
> (xem [Quy trình tạo extension mới](#quy-trình-tạo-extension-mới)).

## Cài đặt

Trong app vBook, thêm repository bằng URL registry thô:

```
https://raw.githubusercontent.com/qsang2025/Qsang_vbook/main/plugin.json
```

Các bước: mở vBook → mục Extension / Repository → dán URL trên → chọn
extension muốn cài. Repo đã có trên GitHub
(https://github.com/qsang2025/Qsang_vbook, branch `main`) nên URL registry
trên dùng được ngay.

Muốn dùng thêm nguồn từ repo khác, xem `repository.json` (danh sách registry
ngoài) — dán URL registry của repo đó vào app theo cách tương tự.

## Cấu trúc thư mục

```
Qsang_vbook/
  AGENTS.md                     # quy tắc nhà — đọc trước khi đụng vào extension
  README.md                     # file này
  STATUS.md                     # trạng thái sống/chết từng nguồn (CI sinh tự động)
  plugin.json                   # registry gốc — SINH TỰ ĐỘNG, không sửa tay
  repository.json               # danh sách registry ngoài (registry-of-registries)
  .agents/skills/vbook-extensions/  # skill + 5 mode + reference/extension-api.md
                                # + templates/ 7 loại + scripts/vbook.js
  lib/                          # thư viện dùng chung (CHỈ LÀ NGUỒN MẪU —
                                # build copy file cần thiết vào src/ từng extension)
    cleanHtml.js                # 1 bản chuẩn làm sạch HTML
    config-helpers.js           # normalizeUrl / absUrl / cleanText / storyItem / nextPageToken
    fetch-helpers.js            # fetch thường → fallback Engine.newBrowser, mirror failover
    gbk.js                      # xử lý web Trung (GBK)
  templates/                    # template tạo nguồn mới theo từng loại
    novel/ comic/ chinese_novel/ video/ audio/ translate/ tts/ ai/
  extensions/                   # nguồn thật — xem Catalog bên dưới
    novel/apptruyenchu/         # App Truyện Chữ (novel, v4)
    video/hhkungfu/             # HHKUNGFU (video, v1)
                                # mỗi nguồn: icon.png + plugin.json + src/ + test.json
                                # + plugin.zip (do build sinh ra, commit kèm để app
                                #   cài được từ URL repo — xem AGENTS.md mục 8)
  tools/cli/                    # build / catalog / validate
  scripts/                      # cli.js (CLI một cửa) + health-check.js
                                # (probe) + vbook.js (test/testall/install)
                                # + build_registry.py + clean.py
  package.json                  # npm scripts cho CLI một cửa
  docs/                         # EXTENSION_DEVELOPMENT_GUIDE.md,
                                # verify-checklist.md, CONTRIBUTING.md
                                # (hợp đồng API ở extension-api.md tại root, không ở docs/)
  .github/ISSUE_TEMPLATE/       # form xin nguồn mới
```

## Quy trình tạo extension mới (tóm tắt)

1. Đọc `AGENTS.md` và skill `.agents/skills/vbook-extensions/SKILL.md`
   (chỉ đọc thêm đúng một file mode phù hợp: `create`).
2. Scaffold từ template đúng loại trong `templates/<loại>/` — không copy
   nguyên một nguồn cũ rồi sửa.
3. Điền `config.js` (BASE_URL + danh sách mirror dự phòng), viết đủ vòng đời
   `home` / `genre` / `search` / `detail` / `toc` / `chap` trong `src/`,
   khai báo đủ trong script map của `plugin.json`.
4. Thêm `test.json` (golden fixture): ít nhất 1 case search và 1 case detail
   có kết quả kỳ vọng.
5. Chạy `validate` (catalog ≡ đĩa, JSON hợp lệ, version khớp, fixture đúng
   định dạng, linter Rhino ES6) rồi `build` bằng CLI một cửa `scripts/cli.js`;
   test trên app thật qua developer server (`test` / `testall`).
6. Bump version ở **cả** manifest nguồn **và** registry gốc (sinh lại bằng
   build-catalog), rebuild `plugin.zip` sau mỗi thay đổi.
7. Kiểm tra lần cuối bằng `docs/verify-checklist.md` trước khi đưa nguồn
   vào catalog.

Chi tiết đầy đủ: `docs/EXTENSION_DEVELOPMENT_GUIDE.md`.
Hợp đồng API duy nhất: `extension-api.md`.

## Quy định về plugin.zip — commit kèm để app cài được từ URL repo

`plugin.zip` là artifact do build sinh ra từ `src/`, **được commit kèm**
với từng nguồn (quyết định của Anh ngày 2026-11-06). Lý do: registry trỏ
tới `raw.githubusercontent.com/.../extensions/<loại>/<tên>/plugin.zip` nên
app vBook chỉ cài được khi zip có mặt trên GitHub.

- `.gitignore` chặn `*.zip` nhưng chừa `extensions/**/plugin.zip`.
- Sau mỗi thay đổi trong `src/` phải **rebuild zip ngay**; `validate` kiểm
  tra mỗi nguồn đều có `plugin.zip` và nội dung zip khớp `src/` hiện tại
  (plugin.json + src/*.js + file lib đã inline).
- Không commit file .zip nào khác (zip thử, zip tạm).

Chi tiết: `AGENTS.md` mục 8.

## Catalog

Bảng này sinh tự động từ registry (`plugin.json`) — hiện có 2 nguồn.

| Tên | Loại | Ngôn ngữ | Phiên bản | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| App Truyện Chữ | novel | vi_VN | 3 | https://apptruyenchu.pro | xem STATUS.md |
| HHKUNGFU | video | vi_VN | 1 | https://hhkungfu.ee | xem STATUS.md |

Trạng thái sống/chết từng nguồn xem `STATUS.md` (CI cập nhật hàng ngày).

## Attribution — nguồn gốc từng phần mượn

Repo này đứng trên công sức của cộng đồng vBook. Code mượn **giữ attribution**,
không ghi tác giả Qsang cho phần copy. 32/33 repo tham khảo không có file
LICENSE; chỉ `vbook_duongden` có — đọc `LICENSE` của duongden trước khi dùng
bất kỳ phần nào từ đó.

| Phần trong repo này | Mượn từ | Ghi chú |
|---|---|---|
| Skill `.agents/skills/vbook-extensions/` (SKILL.md + 5 mode create/fix/test/audit/refactor) | Darkrai9x | Xương sống hạ tầng dev |
| `extension-api.md` + bản sao trong skill (`reference/extension-api.md`) | Darkrai9x | Hợp đồng chuẩn duy nhất, 2 bản giống hệt nhau (2.336 dòng) |
| `scripts/vbook.js` (connect/test/testall/build/install) | Darkrai9x | 435 dòng, không dependency |
| CLI + tổ chức `extensions/<loại>/<tên>/` | kychitoge, yae-miko-313 | build/catalog/validate/verify/scaffold; `src/` lộ trên đĩa kèm zip |
| `lib/config-helpers.js` (`normalizeUrl`, `absUrl`, `cleanText`, `storyItem`, `nextPageToken`) | ustaezav | Row-parser dùng chung home + genre; search bằng sitemap + cache |
| `chap.js` chắc chắn (retry 3 lần, 2 chiến lược trích xuất, lỗi tiếng Việt) | lequang0996 | Mobile UA + Referer + backoff; fallback 13 selector chọn kết quả dài nhất |
| `lib/cleanHtml.js` (1 bản chuẩn) | hajljnopera (`libs.js`), Darkrai9x | Gộp 11 biến thể `cleanHtml`/`libs.js` thành 1 bản duy nhất |
| `track.js` (audio) + fallback Cloudflare bằng `Engine.newBrowser` | mizhm | Vòng đời audio + phụ đề lrc/vtt; retry 429, chờ title `Just a moment` |
| Kỷ luật repo (bump version 2 nơi, rebuild zip sau mỗi thay đổi, không commit token/cookie/JWT thật) | sonzin | Ghi trong `AGENTS.md` mục 7 |
| `clean.py` (prune site chết + viết lại registry) + `test.json` theo nguồn | lethituyen | Tooling bảo trì |
| `repository.json` (registry-of-registries) | longvuu | Danh sách 19 registry ngoài mẫu ban đầu |
| Tài liệu, README tutorial, hướng dẫn cài "paste URL registry thô vào VBook" | SoulGod, duongden, BaoBao | README 290 dòng làm tài liệu hợp đồng (SoulGod/duongden/BaoBao) |

## Đóng góp

Muốn xin nguồn mới: mở issue theo mẫu
`.github/ISSUE_TEMPLATE/request_source.yml`.
Muốn tự thêm nguồn: đọc `docs/CONTRIBUTING.md` và
`docs/verify-checklist.md` trước.

## Giấy phép

Repo này dùng **MIT License** (file `LICENSE` ở root, copyright Dương Nguyễn
Quốc Sáng, 2026): ai cũng được dùng, copy, sửa, kể cả dùng vào việc kiếm tiền,
với điều kiện giữ lại dòng copyright + bản LICENSE. Code tự viết thuộc về
Qsang; phần mượn giữ nguyên attribution ở bảng trên và tuân thủ LICENSE gốc
(nếu có).
