# qbtr.cc (#100) — PROBE-README (cho parent chạy trên máy thật)

Probe tạm, chỉ để trả lời: **WebView của app có đọc được nội dung chương qbtr.cc không?**
Chưa phải extension thật — KHÔNG merge, KHÔNG chạy build-catalog (probe không được vào registry).

Lưu ý tên file: đặt là `QBTR-PROBE-README.md` (không phải `PROBE-README.md`)
vì repo root đã có sẵn file `PROBE-README.md` của 8book (#99) được commit
từ nhánh feature/8book — ghi đè sẽ làm mất file đó.

## Chạy probe (parent, trên máy thật)

```bash
cd ~/workspace/vbook/work/qbtr
node scripts/cli.js build extensions/chinese_novel/qbtr
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js install extensions/chinese_novel/qbtr
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js test extensions/chinese_novel/qbtr probe.js
```

Giữ vBook mở ở foreground + dev mode bật khi chạy (máy phải trả `/connect` 200).
Probe chạy ~40–60 giây, không cần đối số. (Build offline đã kiểm chứng OK 2026-11-16:
plugin.zip gồm probe.js + config.js.)

## Probe làm gì (`src/probe.js`)

1. Mở trang chương 1 sách mẫu **10047 综漫，人在实教，幕后开启杀戮都市**
   (`/tongren/10047/1.html`), poll `.read_chapterDetail` mỗi 1 giây, tối đa 14 giây.
2. Ghi lại: tiêu đề trang, `.read_chapterName h1`, độ dài `.read_chapterDetail`,
   200 ký tự đầu + 200 ký tự cuối, số lần xuất hiện "简介" (site lặp phần giới
   thiệu 2 lần đầu mỗi chương — build phải cắt), có chữ đăng nhập
   (`登入`/`登錄`/`登录`) hay trả phí (`付費`/`付费`/`VIP`/`購買`/`购买`) không.
3. Mở trang chi tiết (`/tongren/10047.html`), đếm link `.book_list a`
   (mục lục đầy đủ trên trang chi tiết) + mẫu 3 link đầu.
4. Nếu mục lục có ≥ 2 link, mở chương thứ 2 (link thứ 2 trong mục lục,
   resolve relative → tuyệt đối trên host qbtr.cc) và đo lại
   `.read_chapterDetail` (kiểm tra mẫu có lặp lại không).

## Đọc kết quả — BUILD hay DROP

| Kết quả | Nghĩa | Quyết định |
|---|---|---|
| `CH1-FOUND:YES`, `CH1-LEN` ≥ 500, `CH1-SAMPLE` là văn xuôi tiếng Trung thật, `CH2-LEN` ≥ 500 | WebView render được chương đầy đủ, mẫu lặp lại | **BUILD** — port base Evamirion v1 (viết lại theo hợp đồng hiện tại: chap.js đọc `.read_chapterDetail` + `.read_chapterName h1`, decode GBK, cắt phần giới thiệu lặp đầu chương; toc/detail/home/gen từ HTML tĩnh; search POST EmpireCMS `/e/search/index.php` qua WebView theo mẫu ffxs8/sjks88) |
| `CH1-LEN` = 0 hoặc < 100 sau 14 giây | WebView không render nội dung tĩnh | **DROP** — không có đường đọc nào (kiểm tra lại bằng fetch tĩnh từ VM trước khi kết luận, vì HTML tĩnh đã có nội dung) |
| `CH1-LEN` ngắn (teaser vài chục–vài trăm ký tự) hoặc `HAS-LOGIN:YES` / `HAS-PAY:YES` | Chỉ xem trước / cần đăng nhập / trả phí | **DROP** — không bypass, không login |
| `TOC-LINKS:0` nhưng `CH1-FOUND:YES` | Chương đọc được, mục lục chưa nạp trong WebView | Vẫn **BUILD** được (mục lục có đầy đủ trong HTML tĩnh — khảo sát ở bước build) |

## Bối cảnh (từ VM, rescan #12 + soi thêm 2026-11-16)

- Homepage 200 (26,5 KB), giống nhau cả 2 UA; title 全本同人小说网.
- **HTML tĩnh ĐÃ CÓ nội dung chương** trong `div.read_chapterDetail` — trái với
  rescan #12 ghi "ch.1 chỉ 1 dòng teaser 88 ký tự, không có content div" (không
  tái hiện được trên 3 sách đã kiểm: 10047, 10127, 10011 — ch.1 1.373 / 3.442 /
  2.612 ký tự; ch.2 1.160 / 3.627 ký tự). Có thể rescan kiểm sách khác hoặc URL
  khác; probe trên máy thật sẽ là bằng chứng quyết định.
- Sách mẫu: **10047 综漫，人在实教，幕后开启杀戮都市** (Elof, 1.205 chương,
  ngày 2026-09-08), detail `/tongren/10047.html`, ch.1 `/tongren/10047/1.html`,
  ch.2 `/tongren/10047/2.html`. Sách discovery: 10127 影视：人在诸天成就战力天花板
  (647 chương); sách changgui: 10011 我老婆是天仙妈 (471 chương).
- Trang chương: h1 `<tên> 第N章`, nội dung `.read_chapterDetail` (thẻ p),
  pageNav "首章 | n/tổng | 下一章 | 尾章 | 目录". Không có marker login/pay nào
  trên 5 trang chương đã kiểm. Không có ảnh bìa trong HTML tĩnh (có script
  cover.js — bìa có thể nạp qua JS).
- Trang chi tiết: h1 tên sách, tác giả, ngày đăng, mô tả trong
  `.book_info .infos p`; không có trạng thái/word-count; mục lục đầy đủ
  (`.book_list.clearfix ul li a`, text " 第N节").
- Trang danh sách: `.bk > a[href="/tongren/<id>.html"] > .infos > h3` (tên),
  `.booknews` (tác giả + size + ngày), `p` (mô tả); phân trang
  `/tongren/index_N.html`. Thể loại: `/tongren/`, `/changgui/`, `/hot/`,
  tags `/m_tags.html` → `/tags-<id>-0.html`.
- Tìm kiếm: form EmpireCMS POST `action='/e/search/index.php'`
  class `formSearch`, field `keyboard` + hidden `show=title`, `classid=0`
  (mẫu ffxs8/sjks88 — WebView POST ở bước build).
- Base Evamirion **v1 ĐỌC ĐƯỢC** (chap.js dùng đúng `.read_chapterDetail` +
  `.read_chapterName h1`, decode gb2312) — selector khớp site thật; chỉ cần
  viết lại theo hợp đồng hiện tại (không copy nguyên: base dùng let,
  return null, không pacing, không Response.error).
- Sau khi probe xong (dù BUILD hay DROP): **xóa `src/probe.js`** khỏi extension thật
  trước khi merge (tiền lệ ijjxs #96).
