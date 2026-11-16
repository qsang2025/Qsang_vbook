# fuxsb.com (#101) — FUXSB-PROBE-README (cho parent chạy trên máy thật)

Probe tạm, chỉ để trả lời: **sau khi Anh qua challenge Cloudflare trong trình duyệt của app, fetch của extension + WebView có đọc được trang chi tiết fuxsb.com không?** Chưa phải extension thật — KHÔNG merge, KHÔNG chạy build-catalog (probe không được vào registry).

## Chạy probe (parent, trên máy thật)

```bash
cd ~/workspace/vbook/work/fuxsb
node scripts/cli.js build extensions/chinese_novel/fuxsb
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js install extensions/chinese_novel/fuxsb
VBOOK_SERVER=http://127.0.0.1:18080 node scripts/cli.js test extensions/chinese_novel/fuxsb probe.js
```

Giữ vBook mở ở foreground + dev mode bật khi chạy (máy phải trả `/connect` 200).
Probe chạy ~40–60 giây, không cần đối số. (Build offline đã kiểm chứng OK 2026-11-16:
plugin.zip gồm probe.js + config.js.)

## Probe làm gì (`src/probe.js`)

1. **Fetch tĩnh trang chi tiết sách mẫu 27772 据说我是神仙下凡** (`/chuanyue/27772.html`) — đúng đường extension sẽ dùng (fetch với UA mặc định của runtime + cookie dùng chung, KHÔNG xoay UA — quy tắc nhà 10): ghi `DETAIL-FETCH-OK` / status / title / `DETAIL-CONTENT-LEN` (đoạn text dài nhất trong `.con_box div`) + 200 ký tự đầu / `TOC-PAGES` (số trang lớn nhất từ link phân trang `_<n>.html`) / `DETAIL-CF-SHELL` (có chuỗi "Just a moment" không) / `DETAIL-HAS-LOGIN` / `DETAIL-HAS-PAY`.
2. **Fetch tĩnh sách discovery 27771 龙傲天曾为反派诞下一子** (`/qihuan/27771.html`) — điểm dữ liệu thứ 2 cho câu hỏi CF: `DISC-FETCH-OK` / title / `DISC-CONTENT-LEN`.
3. **WebView ch.1 (= trang chi tiết 27772)**: `b.launch` rồi poll `.con_box div` mỗi 1 giây, tối đa 14 giây → `CH1-FOUND` / `CH1-LEN` / `CH1-SAMPLE` / `HAS-LOGIN` / `HAS-PAY` / `CF-SHELL`.
4. **WebView ch.2** (`/chuanyue/27772_2.html`): đo lại → `CH2-FOUND` / `CH2-LEN` / `CH2-SAMPLE`.

## Đọc kết quả — BUILD hay GIỮ Ở DỰ PHÒNG

| Kết quả | Nghĩa | Quyết định |
|---|---|---|
| `DETAIL-FETCH-OK:YES` (hoặc WebView `CH1-FOUND:YES`), `CH1-LEN` ≥ 500, `CH1-SAMPLE` là văn xuôi tiếng Trung thật, `CH2-LEN` ≥ 500 | Cookie CF dùng chung được — đường đọc tồn tại | **BUILD** — port base Moleys v7, viết lại theo hợp đồng hiện tại: chap.js đọc đoạn text dài nhất trong `.con_box div` (không dùng `.last()` — div cuối thường rỗng); toc.js lấy tổng số trang = số lớn nhất từ link phân trang (link đầu là "下一页" không có số, base đọc sai); fetch KHÔNG xoay UA |
| `DETAIL-FETCH-OK:NO` / status 403, hoặc `DETAIL-CF-SHELL:true`, và WebView cũng rỗng/403 | CF vẫn chặn cả fetch lẫn WebView dù đã qua challenge 1 lần | **GIỮ Ở DỰ PHÒNG** — không build; thử lại sau (trạng thái CF thay đổi theo thời gian, như nhóm syosetu hồi phục ở rescan #12) |
| `CH1-LEN` ngắn (teaser) hoặc `HAS-LOGIN:YES` / `HAS-PAY:YES` | Chỉ xem trước / cần đăng nhập / trả phí | **DROP** — không bypass, không login |
| `TOC-PAGES:1` nhưng chương đọc được | Trang chi tiết không lộ link phân trang trong WebView | Vẫn **BUILD** được (toc lấy tổng số trang từ fetch tĩnh) |

## Bối cảnh (từ VM, rescan #12 + soi thêm 2026-11-16)

- Homepage 200 (36 KB); link sách dạng `/<cat>/<id>.html`; thể loại: chuanyue, qihuan, gudai, xiandai, tongren, wangyou, baihe, special.
- Trang chi tiết: mobile UA trả 200, desktop UA trả 403, curl UA mặc định trả 403 — CF chặn theo đường dẫn + theo UA. HTML có script `/cdn-cgi/challenge-platform/` (thăm dò CF thụ động) nhưng vẫn có đủ nội dung thật.
- Sách KHÔNG có "chương" riêng: toàn bộ sách phân trang thành `/<cat>/<id>.html`, `/<cat>/<id>_2.html`, … `/<cat>/<id>_283.html` (sách mẫu 27772: 283 trang; sách discovery 27771: 129 trang). Mỗi trang = 1 mục "chương" theo base Moleys v7.
- Nội dung chương trong `.con_box div` (đoạn dài nhất): trang 1 sách mẫu 2.794 ký tự, mở đầu "启朝太和二十二年冬，帝与心腹重臣夜梦升仙。…"; trang 2: 2.791 ký tự, mở đầu "耳边忽然传来一道极低的嗡鸣声…". Sách discovery trang 1: 3.315 ký tự. Không có marker login/pay (登录/登入/付费/VIP/购买/会员 đều 0).
- Mirror: `m.fuxsb.com` 200, `www.fuxsb.cc` 200 (đều kiểm chứng từ VM).
- Base Moleys v7 **đọc được** (plaintext, đủ vòng đời trừ search — không có search.js); nếu BUILD thì viết lại hoàn toàn theo hợp đồng hiện tại (base dùng let, return null, không pacing, không Response.error, không config DOMAIN chuẩn).
- Site là BL/耽美 (腐小说) — manifest probe đã gắn `nsfw: true`; quyết định cờ này ở bước build theo tiền lệ các nguồn 18+/đam mỹ đã merge.
- Sau khi probe xong (dù BUILD hay GIỮ LẠI): **xóa `src/probe.js`** khỏi extension thật trước khi merge (tiền lệ ijjxs #96).
