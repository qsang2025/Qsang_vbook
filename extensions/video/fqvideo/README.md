# FQ Video — vBook Extension

Xem **phim ngắn (真人短剧)**, **mạn kịch / hoạt hình (漫剧)** và **hoạt hình AI (AI剧)** thuộc hệ sinh thái Fanqie / Hồng Quả (ByteDance) qua API trực tiếp, phát **MP4 native** không cần proxy hay root.

- **Nguồn:** `https://fanqienovel.com` (mục lục tương thích chéo) + cổng video chính thức `https://hongguoduanju.com` (chung `series_id` / `item_id`).
- **Type:** `video` · **Locale:** `zh_CN` · **Version:** 1 · **Author:** `MuseAi` · **License:** MIT (`encrypt: false`).
- **Chuỗi phát:** `toc.js` → `chap.js` → `track.js` → `type: "native"`, `mimeType: "video/mp4"`, `headers: { "Referer": "https://hongguoduanju.com/" }`.

## Quyết định xây mới clean-room (không port từ `duongden/vbook`)

Qua khảo sát 47+ repo cộng đồng vBook (`Qsang_vbook`, `vbook-extensions_Darkrai9x`, `duongden/vbook`, tìm kiếm toàn GitHub), chỉ duy nhất `duongden/vbook` có mục `FQ Video` (`type: "video"`). Không port mã nguồn từ đó vì hai lý do độc lập:

1. **Giấy phép không tương thích:** `duongden/vbook` sử dụng **GPL-3.0**, không tương thích với giấy phép **MIT** của `Qsang_vbook`.
2. **Không có mã nguồn mở:** `duongden/vbook` không lưu source `FQ-video` trong repo; gói zip ngoài repo trên `vbook.trasua.workers.dev` bật `"encrypt": true` với toàn bộ 15 file `src/*.js` bị mã hóa.

Vì vậy `extensions/video/fqvideo` được xây mới hoàn toàn (clean-room MIT) theo chuẩn `extensions/video/hhtqvietsub` (task 113), `extensions/video/hoathinh3d`, `AGENTS.md` và `extension-api.md`.

## Kiến trúc API trực tiếp & luồng phát native

| Chức năng | Endpoint / Cơ chế | Ghi chú |
|---|---|---|
| Trang chủ (`home.js`) | 7 tab tĩnh (0 request — quy tắc 9) | BXH & danh mục `real-drama`, `comic-drama`, `ai-drama`, `hot-drama` trỏ về `search.js` |
| Thể loại (`genre.js`) | 40 chuyên mục tĩnh (0 request) | 24 thể loại Phim ngắn + 8 Mạn kịch + 8 Hoạt hình AI (loại trừ `/category/comic` truyện tranh tĩnh) |
| Duyệt danh sách (`search.js`) | `GET https://hongguoduanju.com/rank/<slug>?page=N` và `/category/<type>[/<topic>]?page=N` | Phân tích JSON `_ROUTER_DATA` bằng bộ quét cân bằng ngoặc (không dùng regex dễ cắt cụt) |
| Tìm kiếm (`search.js`) | `GET https://hongguoduanju.com/api/search/result?query=<q>&page=N` (`Referer: .../search`) | Giới hạn từ khóa 1–30 ký tự; bắt captcha `bdturing-verify` / `search_verification_required` rõ ràng |
| Chi tiết (`detail.js`) | `GET https://hongguoduanju.com/detail?series_id=<id>` | Hỗ trợ cả URL `hongguoduanju.com/detail`, `/player/<id>` và `fanqienovel.com/page/<id>?fq_type=(short\|animation)` |
| Mục lục (`toc.js`) | `vid_list` + `accessible_episode_cnt` từ trang chi tiết, làm giàu tên tập tiếng Trung từ `GET https://fanqienovel.com/api/reader/directory/detail?bookId=<id>` | Đánh dấu `lock: true` minh bạch cho tập từ `accessible_episode_cnt + 1` trở đi |
| Chọn luồng (`chap.js`) | Đóng gói `{ seriesId, itemId, mode }` thành 2 track (`HD Trực tiếp (Tự động)` và `MP4 Tiêu chuẩn (Dự phòng)`) | Không giữ link CDN hết hạn (~1 giờ TTL); `track.js` lấy link mới ngay khi phát |
| Giải luồng (`track.js`) | 1) `POST /api/video/protected/play-info` (`definition: "720p"`) → `legacy_play_info.main_url` (MP4 720p không mã hóa `er=0` cho Mạn kịch & Hoạt hình AI)<br>2) `POST /api/video/protected/fallback-play-info` (`{"item_id": ...}`) → `main_url` (MP4 muxed không mã hóa `er=0` đầy đủ thời lượng cho Phim ngắn & dự phòng) | Tuyệt đối không dùng `/video/public/<vid>/360p.mp4` (chỉ là clip xem trước SEO 10 giây). Không xoay User-Agent (quy tắc 10). Pacing qua `rate-limit.js` (quy tắc 11). |

## Phạm vi công khai: Tập 1–5 miễn phí vs Tập 6+ khóa ứng dụng

- **Tập 1–5 mỗi bộ:** API web công khai của ByteDance (`hongguoduanju.com`) trả về **MP4 H.264+AAC không mã hóa (`er=0`) đầy đủ thời lượng** (phát trực tiếp qua `type: "native"`).
- **Tập 6 trở đi:** Cổng web công khai trả `HTTP 403` (`public_fallback_unavailable` / `protected_playback_unavailable`). API app di động (`fqnovel.com` / `snssdk.com`) bỏ qua mọi request không có chữ ký nhị phân độc quyền (`X-Argus`/`X-Ladon`/`X-Medusa`/`X-Helios`) và mã hóa CENC (`spade_a`). Tuân thủ quy tắc nhà (MIT clean-room, không vượt DRM/paywall, không nhúng token/secret), extension đánh dấu `lock: true` ở `toc.js` và trả thông báo tiếng Việt rõ ràng ở `track.js` khi mở tập 6+.

## Kiểm thử & đóng gói

Chạy kiểm tra tĩnh và đóng gói offline:

```bash
node scripts/cli.js build extensions/video/fqvideo
node scripts/cli.js build-catalog
node scripts/cli.js validate
node scripts/cli.js build-catalog --check
```

Kiểm thử trên điện thoại thật qua vBook Developer Server (khi đã cấu hình `VBOOK_SERVER`):

```bash
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js connect
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo home.js
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo genre.js
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo search.js "/rank/hot-real-drama" ""
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo search.js "东北" ""
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo detail.js "https://hongguoduanju.com/detail?series_id=7706512650816982040"
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo toc.js "https://hongguoduanju.com/detail?series_id=7706512650816982040"
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo chap.js "https://hongguoduanju.com/player/7706512650816982040/7706514645208534041"
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo track.js '{"seriesId":"7706512650816982040","itemId":"7706514645208534041","mode":"hd"}'
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js testall extensions/video/fqvideo
VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js install extensions/video/fqvideo
```
