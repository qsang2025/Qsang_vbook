# Qsang_vbook

Tuyển tập extension cho app vBook: đọc truyện chữ (Việt + Trung), truyện tranh,
xem video, nghe audio, dịch và TTS — viết theo một khung sườn thống nhất, có
kiểm tra tự động, mỗi nguồn đều có fixture kiểm thử.

Hiện có **66 nguồn** trong catalog. Chỉ đọc nội dung miễn phí: chương khóa hoặc
VIP hiện thông báo rõ ràng, không mở khóa, không vượt paywall.

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

## Lưu ý khi dùng

- Một số nguồn có nội dung 18+ được gắn cờ `nsfw` trong catalog.
- Một vài nguồn chỉ đọc đủ chương khi đã đăng nhập tài khoản miễn phí của
  chính site đó (ghi rõ trong mô tả của nguồn); extension không tự đăng nhập
  thay người dùng và không lưu mật khẩu hay token thật.
- Trạng thái sống/chết từng nguồn xem `STATUS.md` (CI cập nhật hàng ngày).

## Cấu trúc thư mục

```
Qsang_vbook/
  AGENTS.md                     # quy tắc nhà — đọc trước khi đụng vào extension
  README.md                     # file này
  STATUS.md                     # trạng thái sống/chết từng nguồn (CI sinh tự động)
  plugin.json                   # registry gốc — SINH TỰ ĐỘNG, không sửa tay
  repository.json               # danh sách registry ngoài (registry-of-registries)
  extension-api.md              # hợp đồng API duy nhất của vBook
  .agents/skills/vbook-extensions/  # skill + mode + reference + templates
  lib/                          # thư viện dùng chung (CHỈ LÀ NGUỒN MẪU —
                                # build copy file cần thiết vào src/ từng extension)
  templates/                    # template tạo nguồn mới theo từng loại
  extensions/                   # nguồn thật — xem Catalog bên dưới
                                # mỗi nguồn: icon.png + plugin.json + src/ + test.json
                                # + plugin.zip (do build sinh ra, commit kèm để app
                                #   cài được từ URL repo — xem AGENTS.md mục 8)
  scripts/                      # cli.js (CLI một cửa) + health-check.js
  tools/                        # build / catalog / validate
  docs/                         # EXTENSION_DEVELOPMENT_GUIDE.md,
                                # verify-checklist.md, CONTRIBUTING.md
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
với từng nguồn. Lý do: registry trỏ tới
`raw.githubusercontent.com/.../extensions/<loại>/<tên>/plugin.zip` nên
app vBook chỉ cài được khi zip có mặt trên GitHub.

- `.gitignore` chặn `*.zip` nhưng chừa `extensions/**/plugin.zip`.
- Sau mỗi thay đổi trong `src/` phải **rebuild zip ngay**; `validate` kiểm
  tra mỗi nguồn đều có `plugin.zip` và nội dung zip khớp `src/` hiện tại
  (plugin.json + src/*.js + file lib đã inline).
- Không commit file .zip nào khác (zip thử, zip tạm).

Chi tiết: `AGENTS.md` mục 8.

## Catalog

Bảng này sinh từ registry (`plugin.json`) — hiện có 66 nguồn.

| Tên | Loại | Ngôn ngữ | Phiên bản | Nguồn |
|---|---|---|---|---|
| 17k | chinese_novel | zh_CN | 1 | https://www.17k.com |
| 52书库 | chinese_novel | zh_CN | 1 | https://www.52shuku.net |
| alicesw | chinese_novel | zh_CN | 1 | https://www.alicesw.com |
| IHuaBen | chinese_novel | zh_CN | 1 | https://www.ihuaben.com |
| NovelCooksTW | chinese_novel | zh_TW | 1 | https://novel.cooks.tw |
| QuanBen | chinese_novel | zh_CN | 1 | https://quanben5.com |
| Tadu | chinese_novel | zh_CN | 2 | https://www.tadu.com |
| Trxs | chinese_novel | zh_CN | 1 | https://trxs.cc |
| Zongheng | chinese_novel | zh_CN | 3 | https://www.zongheng.com |
| 书本书 | chinese_novel | zh_CN | 1 | https://www.shubenshu.com |
| NiACG | comic | zh_CN | 5 | https://www.niacg.com |
| AkayTruyen | novel | vi_VN | 1 | https://akaytruyen.com |
| App Truyện Chữ | novel | vi_VN | 10 | https://apptruyenchu.pro |
| AzTruyen | novel | vi_VN | 2 | https://aztruyen.top |
| Bqgoo | novel | zh_CN | 1 | https://www.bqgoo.cc |
| Bàn Long | novel | vi_VN | 1 | https://blhvip.vn |
| DocLN | novel | vi_VN | 1 | https://docln.sbs |
| La Cà Truyện | novel | vi_VN | 8 | https://lacatruyen.site |
| LilyHub | novel | vi_VN | 1 | https://www.lilyhub.top |
| MongTruyen | novel | vi_VN | 1 | https://mongtruyen.com |
| Mê Truyện Chữ | novel | vi_VN | 8 | https://metruyenchu.com.vn |
| Mê Truyện Chữ Org | novel | vi_VN | 3 | https://metruyenchu.org |
| Mê Truyện Hot VN | novel | vi_VN | 3 | https://metruyenhotvn.com |
| Mê Đọc Truyện | novel | vi_VN | 1 | https://medoctruyen.vn |
| Mê Đọc Truyện Chữ | novel | vi_VN | 1 | https://medoctruyenchu.net |
| QuyKhu | novel | vi_VN | 1 | https://quykhu.com |
| SS Truyện | novel | vi_VN | 4 | https://sstruyen.net |
| Storya | novel | vi_VN | 1 | https://storya.click |
| Sáng Tác Việt APP | novel | vi_VN | 7 | https://sangtacviet.app |
| TacGiaViet | novel | vi_VN | 1 | https://tacgiaviet.com |
| Tang Thu Vien | novel | vi_VN | 1 | https://tangthuvien.org |
| TiemtruyenchuVIP | novel | vi_VN | 8 | https://tiemtruyenchu.cloud |
| Tiên Vực | novel | vi_VN | 1 | https://tienvuc.blog |
| TrichTinhLau | novel | vi_VN | 1 | https://trichtinhlau.com |
| Truyen247 | novel | vi_VN | 1 | https://truyen247.pro |
| Truyen4u | novel | vi_VN | 1 | https://truyen4u.com |
| TruyenC | novel | vi_VN | 7 | https://truyenc.net |
| TruyenChu | novel | vi_VN | 1 | https://truyenchu.net |
| TruyenDich.AI | novel | vi_VN | 1 | https://truyendich.space |
| TruyenNow | novel | vi_VN | 1 | https://longthieu.com |
| TruyenTV | novel | vi_VN | 1 | https://www.tvtruyen.space |
| Truyện Full | novel | vi_VN | 5 | https://truyenfull.link |
| Truyện Hay | novel | vi_VN | 1 | https://truyenhay.com |
| Truyện Hoàn | novel | vi_VN | 6 | https://truyenhoan.com |
| Truyện Hoàng Dung | novel | vi_VN | 1 | https://truyenhoangdung.xyz |
| Truyện Mơ | novel | vi_VN | 1 | https://truyenmo.one |
| TruyệnHD | novel | vi_VN | 1 | https://truyenhdc.com |
| ValvrareTeam | novel | vi_VN | 1 | https://valvrareteam.net |
| VivuTruyen | novel | vi_VN | 1 | https://vivutruyen.net |
| Web Truyện Dịch | novel | vi_VN | 1 | https://webtruyendich.com |
| Wetruyen | novel | vi_VN | 2 | https://wetruyen.com |
| Wiki Dịch | novel | vi_VN | 5 | https://wikicv.org |
| Xa Lộ Sách | novel | vi_VN | 1 | https://xalosach.com |
| XTruyện | novel | vi_VN | 3 | https://xtruyen.vn |
| ZTruyen | novel | vi_VN | 1 | https://ztruyen.vn |
| 七猫免费小说 | novel | zh_CN | 6 | https://www.qimao.com |
| 书海阁 | novel | zh_CN | 6 | https://www.shuhaige.tw |
| 和图书 | novel | zh_CN | 2 | https://www.hetushu.com |
| 小說狂人 | novel | zh_TW | 6 | https://czbooks.net |
| 思兔閱讀 | novel | zh_TW | 7 | https://sto9.com |
| 爱下电子书 | novel | zh_CN | 4 | https://ixdzs8.com |
| 稷下書院 | novel | zh_TW | 2 | https://www.novel543.com |
| 笔趣阁 | novel | zh_CN | 5 | https://www.biquge.tw |
| 繁體小說 | novel | zh_TW | 7 | https://www.novels.com.tw |
| Hoạt Hình 3D Trung Quốc | video | vi_VN | 3 | https://phimapi.com/v1/api/the-loai |
| Hoạt Hình AI Trung Quốc | video | vi_VN | 5 | https://www.dailymotion.com |

Trạng thái sống/chết từng nguồn xem `STATUS.md` (CI cập nhật hàng ngày).

## Attribution — nguồn gốc từng phần mượn

Repo này đứng trên công sức của cộng đồng vBook. Code mượn **giữ attribution**,
không ghi tác giả MuseAi cho phần copy. 32/33 repo tham khảo không có file
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
| `extensions/novel/tiemtruyenchu_vip` (API `/api/v1/*`, browser/cookie fallback & HTML selectors; gộp từ bản chính v6 + bản VIP v4 từ v5) | ivanzzz (`ext_Ivan1hai`), sonzin (`vbook-extension_sonzin`), Vearn (`vbook-ext_Evamirion`) | Kết hợp Public API v1 + session fallback cho `tiemtruyenchu.cloud` |
| `extensions/novel/lacatruyen` (API `/api/stories/*`, `/api/chapters/list-chapters` & giải mã AES 2 tầng) | QuocBao (`ext-vbook-w_BaoBao666888`), ivanzzz (`ext_Ivan1hai`) | Giải mã mục lục & chương AES-256-CBC + hỗ trợ `TOKEN` & fallback `previewHtml` cho `lacatruyen.site` |
| `extensions/novel/truyendich` (TruyenDich.AI v1 — API `/api/lists/*` + `/api/categories/*`, HTML detail/toc/chap, 2 phiên bản AI/Convert) | hieu05 (`ext-vbook_yae-miko-313`) | Domain mặc định đổi sang truyendich.space (.store redirect sang .space, .ai sang .fit); vá quirk `.first()` + pacing |

## Đóng góp

Muốn xin nguồn mới: mở issue theo mẫu
`.github/ISSUE_TEMPLATE/request_source.yml`.
Muốn tự thêm nguồn: đọc `docs/CONTRIBUTING.md` và
`docs/verify-checklist.md` trước.

## Giấy phép

Repo này dùng **MIT License** (file `LICENSE` ở root, copyright MuseAi, 2026):
ai cũng được dùng, copy, sửa, kể cả dùng vào việc kiếm tiền, với điều kiện giữ
lại dòng copyright + bản LICENSE. Code tự viết thuộc về MuseAi; phần mượn giữ
nguyên attribution ở bảng trên và tuân thủ LICENSE gốc (nếu có).
