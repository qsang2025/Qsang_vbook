# 8book.com (#99) — PROBE-README (cho parent chạy trên máy thật)

Probe tạm, chỉ để trả lời: **WebView của app có đọc được nội dung chương 8book.com không?**
Chưa phải extension thật — KHÔNG merge, KHÔNG chạy build-catalog (probe không được vào registry).

## Chạy probe (parent, trên máy thật)

```bash
cd ~/workspace/vbook/work/8book
node scripts/cli.js build extensions/chinese_novel/8book
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js install extensions/chinese_novel/8book
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js test extensions/chinese_novel/8book probe.js
```

Giữ vBook mở ở foreground + dev mode bật khi chạy (máy phải trả `/connect` 200).
Probe chạy ~40–60 giây, không cần đối số. (Build offline đã kiểm chứng OK 2026-11-16:
plugin.zip 3.025 bytes, gồm probe.js + config.js.)

## Probe làm gì (`src/probe.js`)

1. Mở trang chương 1 sách mẫu **100806 落花時節又逢君** (`/read/100806/?4760535`),
   poll `#text` mỗi 1 giây, tối đa 14 giây.
2. Ghi lại: tiêu đề trang, `#subtitle`, độ dài `#text`, 200 ký tự đầu,
   có chữ đăng nhập (`登入`/`登錄`) hay trả phí (`付費`/`VIP`/`購買`) không.
3. Mở trang chi tiết (`/novelbooks/100806/`), đếm link `#chapters a`
   (mục lục nạp qua AJAX) + mẫu 3 link đầu.
4. Nếu mục lục có ≥ 2 link, mở chương thứ 2 và đo lại `#text`
   (kiểm tra mẫu có lặp lại không).

## Đọc kết quả — BUILD hay DROP

| Kết quả | Nghĩa | Quyết định |
|---|---|---|
| `CH1-FOUND:YES`, `CH1-LEN` ≥ 500, `CH1-SAMPLE` là văn xuôi tiếng Trung thật, `CH2-LEN` ≥ 500 | WebView render được chương đầy đủ, mẫu lặp lại | **BUILD** — viết mới hoàn toàn từ HTML WebView: chap.js đọc `#text`/`#subtitle` qua Engine; toc/detail/home/genre/gen/search khảo sát sau từ HTML tĩnh + AJAX `/episode/` |
| `CH1-LEN` = 0 hoặc < 100 sau 14 giây | Iframe không render trong WebView | **DROP** — không có đường đọc nào |
| `CH1-LEN` ngắn (teaser vài chục–vài trăm ký tự) hoặc `HAS-LOGIN:YES` / `HAS-PAY:YES` | Chỉ xem trước / cần đăng nhập / trả phí | **DROP** — không bypass, không login |
| `TOC-LINKS:0` nhưng `CH1-FOUND:YES` | Chương đọc được, mục lục chưa nạp trong WebView | Vẫn **BUILD** được (toc lấy qua AJAX `/episode/` hoặc WebView chờ lâu hơn — khảo sát ở bước build) |

## Bối cảnh (từ VM, rescan #12 + soi thêm 2026-11-16)

- Homepage 200 (125 KB); detail `/novelbooks/<id>/` 301 về dạng có `/` cuối.
- Trang chương tĩnh chỉ có 249 ký tự chrome; `#content`, `#subtitle`, `#text` đều rỗng.
- Nội dung nạp qua JS: iframe `#ifr` (`share.html?t=read`); `read.js` postMessage
  `{id, url, eps}` sang iframe sau 500 ms, iframe kích hoạt việc điền `#text`.
- Mục lục nạp qua AJAX `/episode/<id>/<epi>/<p>.html` (giá trị `epi` chưa xác định).
- Base duongden v7 **mã hoá** — không dùng được; BUILD = viết mới hoàn toàn.
- Sau khi probe xong (dù BUILD hay DROP): **xóa `src/probe.js`** khỏi extension thật
  trước khi merge (tiền lệ ijjxs #96).
