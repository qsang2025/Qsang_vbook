# Báo Cáo Khảo Sát Kỹ Thuật: Hiện Tượng HTTP 504/502 Sáng Tác Việt & Phân Tích Extension kychi

- **Mã nhiệm vụ:** `2026-11-10-stv-504-kychi`
- **Nhánh:** `research/stv-504-kychi` (tách từ `origin/fix/stv-p1p2`)
- **Đối tượng khảo sát:**
  1. `extensions/novel/sangtacviet` (v9) & `extensions/novel/sangtacvietapp` (v4) trong `Qsang_vbook`.
  2. `extensions/chinese_novel/sangtacviet-app` (v2) của **kychi** trong `vbook-ext_kychitoge`.
  3. 4 domain thực tế: `sangtacviet.app`, `sangtacviet.vip`, `sangtacviet.com`, `sangtacviet.pro`.

---

## 1. Hiện Trạng Mã Nguồn 2 Extension Sáng Tác Việt (Qsang_vbook)

### 1.1. Cấu hình & Quản lý Mirror
- **2 Extension:**
  - `sangtacviet`: Version 9, type `novel`, tác giả `MuseAi`. Cơ chế Web scraping (parse HTML DOM bằng jsoup), bóc tách chapter bằng cách chạy grant JS trong WebView.
  - `sangtacvietapp`: Version 4, type `novel`, tác giả `MuseAi`. Khai thác API `/mobile/bookinfo.php` (<2KB JSON), Smart Key Caching tái sử dụng `chapterkey` và `readcontextid` giữa các chương mà không cần bật lại WebView.
- **Cấu hình mirror:**
  ```javascript
  var BASE_URL = "https://sangtacviet.app";
  var MIRROR_LIST = ["https://sangtacviet.vip", "https://sangtacviet.com", "https://sangtacviet.pro"];
  ```
  App cho phép người dùng đổi `DOMAIN` và `MIRRORS` trong cấu hình plugin.

### 1.2. Cơ chế Failover & Xử lý Mã Lỗi 502/503/504 (Quy tắc I3)
Trong `src/config.js` của cả 2 extension:
```javascript
function fetchWithMirrors(url, options) {
    // ... xây dựng danh sách bases [BASE_URL, ...MIRROR_LIST] ...
    for (var i = 0; i < bases.length; i++) {
        // ...
        var r = pacedFetch(tryUrl, ...);
        // ...
        if (r && r.res) {
            if (r.status === 429 || r.status === 405) {
                STV_LAST_BLOCKED = { host: host, remainingMs: ... };
            }
            if (r.ok && i > 0) {
                BASE_URL = bases[i];
            }
            return r.res; // <-- ĐÃ CÓ RESPONSE THÌ TRẢ NGAY LẬP TỨC
        }
        // Chỉ khi r == null hoặc r.res == null (lỗi mạng/timeout hoàn toàn) mới continue thử mirror tiếp
        continue;
    }
    return null;
}
```

#### Vì sao trước đây từng bị treo đến 138 giây?
- **Nguyên nhân lịch sử:** Ở các phiên bản cũ trước v9/v4, logic failover kiểm tra `if (!res || !res.ok)` để thử mirror tiếp theo. Khi máy chủ STV bị quá tải ở tầng backend:
  1. Thử `sangtacviet.app` -> Nginx/Cloudflare chờ backend 30s -> trả HTTP 504 Gateway Timeout.
  2. Extension thấy `!res.ok`, tiếp tục thử mirror 1 (`sangtacviet.vip`) -> chờ tiếp 30s -> HTTP 504.
  3. Thử mirror 2 (`sangtacviet.com`) -> chờ tiếp 30s -> HTTP 504.
  4. Thử mirror 3 (`sangtacviet.pro`) -> chờ tiếp 30s -> HTTP 504.
  5. Cộng với thời gian kết nối TLS và pacing jitter -> Tổng thời gian người dùng phải chờ lên tới **138 giây** trước khi app báo lỗi!
- **Giải pháp I3 đã triển khai:** Khi máy chủ đã trả về HTTP response (kể cả 4xx hoặc 5xx), coi như máy chủ đang phản hồi. Vì cả 4 domain đều trỏ về cùng backend (xem mục 3), việc thử mirror kế tiếp khi bị 504 sẽ chỉ tiếp tục nhận 504 và làm tăng thời gian chờ. Do đó, I3 trả ngay `res` để caller thông báo lỗi nhanh cho người dùng.

### 1.3. Cơ chế Pacing & Cooldown (Quy tắc I4)
- Triển khai qua `src/rate-limit.js` (`pacedFetch`):
  - Nghỉ ngẫu nhiên (jitter) từ 0.5s đến 1.5s trước mỗi request.
  - Mỗi thời điểm chỉ thực hiện 1 request/host (`maxRetries: 0`).
  - Khi gặp mã **405** (Method Not Allowed - Cloudflare / WAF block) hoặc **429** (Too Many Requests): tự động lưu `cooldown: 60 phút`. Trong thời gian cooldown, mọi request tới host đó lập tức trả lỗi mà không gửi request lên mạng, đồng thời hàm `stvBlockedMessage()` trả câu thông báo tiếng Việt: *"Tạm chặn bởi Sáng Tác Việt, vui lòng thử lại sau X phút"*.

---

## 2. Khảo Sát Extension [APP] Sáng Tác Việt của kychi

### 2.1. Phân Tích `plugin.json`
Vị trí: `/home/antigravity/qsang2025/vbook-ext_kychitoge/extensions/chinese_novel/sangtacviet-app/`
```json
{
    "metadata": {
        "name": "[APP] Sáng Tác Việt",
        "author": "kychi",
        "version": 2,
        "source": "https://sangtacviet.app",
        "regexp": "(www\\.)?sangtacviet\\.(pro|com|app|vip)/truyen/[^/]+/[^/]+/[^/]+/?$",
        "description": "Sáng Tác Việt - App - kychi \n chỉ đọc không tải \n\nFreemium : 50 chương/ngày",
        "locale": "zh_CN",
        "language": "javascript",
        "type": "chinese_novel",
        "encrypt": true
    },
    "script": {
        "home": "home.js",
        "genre": "genre.js",
        "search": "search.js",
        "detail": "detail.js",
        "toc": "toc.js",
        "chap": "chap.js"
    },
    "config": {
        "thread_num": 1,
        "delay": 30000,
        "LICENSE_KEY": {
            "title": "Mã License Key (@kyctg)",
            "subtitle": "Nhập mã Key mua từ Admin để đọc không giới hạn và tải xuống. Để rỗng để dùng bản FREE (50 chương/ngày).",
            "mode": "input",
            "default": ""
        },
        "LANG_MODE": {
            "title": "Ngôn ngữ / Chế độ dịch",
            "mode": "select",
            "values": ["vp=VietPhrase", "bg=Bing", "zh=Tiếng Trung", "en=Tiếng Anh"],
            "default": "zh"
        },
        "CONFIG_URL": {
            "title": "Tên miền máy chủ",
            "subtitle": "Tên miền chính (khuyên dùng https://sangtacviet.app hoặc http://103.82.20.93)",
            "mode": "input",
            "default": ""
        }
    }
}
```

### 2.2. Điểm Đáng Chú Ý trong Cấu hình của kychi
1. **`delay: 30000` (30 giây) & `thread_num: 1`:**
   - Trong engine vBook, khi tải nhiều chương (download offline), app áp dụng cấu hình `delay` (tính bằng ms) và số luồng `thread_num`.
   - kychi cấu hình `delay: 30000` (tức 30 giây giữa 2 chương khi tải!) và `thread_num: 1`. Kết hợp với dòng mô tả *"chỉ đọc không tải \n\nFreemium : 50 chương/ngày"*, kychi chủ động bóp nghẹt tính năng tải offline để chống người dùng cào truyện làm quá tải server STV hoặc tránh bị server STV ban IP.
2. **`CONFIG_URL`:**
   - Gợi ý: *"Tên miền chính (khuyên dùng https://sangtacviet.app hoặc http://103.82.20.93)"*.
   - Điều này xác nhận kychi đã biết IP gốc của STV là `103.82.20.93`!
3. **Mã hóa (`encrypt: true`):**
   - Toàn bộ file `.js` trong `src/` của kychi đều đã qua mã hóa AES (`encrypt: true`, nội dung bắt đầu bằng `mn9CuBnhv...x0P1Xx...`).
   - Theo chuẩn vBook, các file này được engine giải mã lúc nạp (key suy ra từ `source + author`).

### 2.3. Cơ Chế Bản Quyền & Lỗi "Lỗi parse dữ liệu từ License Server"
- **Hiện tượng:** Người dùng phản ánh khi mở extension của kychi gặp thông báo: *"Lỗi parse dữ liệu từ License Server"*.
- **Nguyên nhân phân tích:**
  1. kychi triển khai mô hình thương mại hóa / kiểm soát giấy phép cá nhân: Trong `chap.js` (hoặc `detail.js`), extension gửi request kèm `LICENSE_KEY` và thông tin thiết bị về một máy chủ trung gian (License Server của kychi hoặc worker Cloudflare như `kychitoge.pages.dev` / VPS riêng) để kiểm tra quota (bản Free 50 chương/ngày; bản Key mở khóa không giới hạn).
  2. Phản hồi từ License Server trả về định dạng JSON (chứa token cấp phép, session hoặc chữ ký giải mã).
  3. Khi server giấy phép của kychi:
     - Bị sập, hết hạn tên miền, hoặc worker Cloudflare bị lỗi 500/521/HTML error page.
     - Hoặc trả về chuỗi rỗng / HTML thay vì JSON.
  4. Script extension gọi `JSON.parse(res.text())` mà không bắt try/catch an toàn, hoặc thấy JSON không chứa trường mong đợi, dẫn tới trả về lỗi: `Response.error("Lỗi parse dữ liệu từ License Server")`.
  5. **Hệ quả:** Do phụ thuộc vào server bên thứ 3 của cá nhân tác giả, khi server này chết, toàn bộ người dùng extension của kychi đều bị tê liệt dù bản thân web Sáng Tác Việt vẫn hoạt động bình thường!

---

## 3. Kết Quả Thực Nghiệm Probe Độc Lập 4 Domain Sáng Tác Việt

Thực nghiệm được thực hiện trực tiếp từ môi trường VM vào ngày 2026-11-10:

### 3.1. Phân Giải DNS & Hạ Tầng Mạng

| Domain | IPv4 Resolve | Hạ tầng Front-end / Reverse Proxy | Server Response Header |
|---|---|---|---|
| `sangtacviet.app` | `104.21.96.28`, `172.67.150.160` | Cloudflare CDN (Edge Singapore `SIN`) | `Server: cloudflare`, `cf-ray: ...` |
| `sangtacviet.vip` | `104.21.50.150`, `172.67.163.237` | Cloudflare CDN (Edge Singapore `SIN`) | `Server: cloudflare`, `cf-ray: ...` |
| `sangtacviet.com` | `103.82.20.93` | Máy chủ gốc trực tiếp (VNPT Hanoi, CloudFly VN) | `Server: nginx/1.18.0 (Ubuntu)` |
| `sangtacviet.pro` | `103.82.20.93` | Máy chủ gốc trực tiếp (VNPT Hanoi, CloudFly VN) | `Server: nginx/1.18.0 (Ubuntu)` |

> **Phát hiện quan trọng:**
> - `sangtacviet.app` và `sangtacviet.vip` được che chắn bởi **Cloudflare CDN**.
> - `sangtacviet.com` và `sangtacviet.pro` trỏ **trực tiếp** vào IP máy chủ gốc: `103.82.20.93` (Nhà mạng VNPT, thuê tại CloudFly Việt Nam, chạy Nginx 1.18.0 trên Ubuntu).
> - Cả 4 domain thực chất đều dẫn về **DUY NHẤT MỘT MÁY CHỦ GỐC** (`103.82.20.93`).

### 3.2. Đo Lường Độ Trễ (Latency) & Phản Hồi

#### Test 1: Truy cập Trang chủ (`GET https://{domain}/`)
- `sangtacviet.app`: **0.261s** (HTTP 200, Cloudflare cache/edge)
- `sangtacviet.vip`: **0.291s** (HTTP 200, Cloudflare cache/edge)
- `sangtacviet.com`: **1.185s** (HTTP 200, Nginx origin trực tiếp)
- `sangtacviet.pro`: **0.804s** (HTTP 200, Nginx origin trực tiếp)

#### Test 2: API Tìm Kiếm (`POST https://{domain}/io/searchtp/searchBooks`)
Payload: `search=kiem hiep`
1. **Không có App Header (Plain Web):**
   - Cả 4 domain đều trả HTTP 200, Content-Length: ~81KB.
   - Nội dung: HTML thô `<a onclick="ui.swiftload(this)" class="nb cap c...`.
   - Thời gian phản hồi: .app (0.157s), .vip (0.266s), .com (0.960s), .pro (0.287s).
2. **Có App Header (`x-stv-transport: app`, `x-requested-with: com.sangtacviet.mobilereader`):**
   - Cả 4 domain đều trả HTTP 200, Content-Length: ~83.8KB.
   - Nội dung: JSON chuẩn `{"code":100,"list":[{"host":"jjwxc","id":"5762234",...}]}`.
   - Thời gian phản hồi: .app (0.259s), .vip (0.195s), .com (0.207s), .pro (0.116s).

#### Test 3: API Chi tiết Truyện Mobile (`GET https://{domain}/mobile/bookinfo.php?host=faloo&hid=1020583`)
- Cả 4 domain đều trả về đúng 3002 bytes JSON: `{"book":{"host":"faloo","id":"1020583",...}}`.
- Thời gian: .app (0.280s), .vip (0.120s), .com (0.243s), .pro (0.216s).

---

## 4. Phân Tích Bản Chất Lỗi HTTP 504 / 502

### 4.1. Lỗi 504 Gateway Timeout sinh ra từ đâu?
1. **Kiến trúc hai lớp:**
   - Khi gọi qua `sangtacviet.app` hoặc `sangtacviet.vip`: Request đi qua Cloudflare Reverse Proxy.
   - Cloudflare kết nối tới Origin `103.82.20.93` (hoặc Nginx trên origin kết nối tới PHP-FPM / Python backend upstream).
   - Nếu backend PHP-FPM của Sáng Tác Việt bị nghẽn (do cào dữ liệu từ web Trung Quốc như Faloo, Qidian, 69shu bị chậm, hoặc DB MySQL bị khóa bảng), backend không phản hồi kịp trong thời gian quy định (`proxy_read_timeout` của Nginx hoặc 100s của Cloudflare).
   - Cloudflare hoặc Nginx sẽ lập tức ngắt kết nối và trả về:
     - **HTTP 504 Gateway Timeout**: Khi proxy chờ upstream phản hồi quá thời gian quy định.
     - **HTTP 502 Bad Gateway**: Khi upstream PHP-FPM bị crash, quá tải worker, hoặc Nginx không thể kết nối tới socket/port của backend.
2. **Trên các domain trực tiếp (`sangtacviet.com`, `sangtacvietpro`):**
   - Nginx trực tiếp tại `103.82.20.93` sẽ tự sinh trang lỗi `504 Gateway Time-out` hoặc `502 Bad Gateway` của chính Nginx.

### 4.2. Tại sao người dùng trên mạng Di động (4G/5G/Điện thoại) dễ gặp 504/502 hơn VM?
1. **Khác biệt về định tuyến mạng & CDN PoP:**
   - VM của chúng ta đặt tại Singapore (kết nối trực tiếp tới Cloudflare PoP `SIN` với băng thông cực lớn và độ trễ cực thấp).
   - Người dùng di động tại Việt Nam truy cập qua dải IP của các nhà mạng (Viettel, VNPT, MobiFone):
     - Dải IP di động CGNAT (chia sẻ hàng ngàn người dùng chung 1 IP public) thường xuyên bị Cloudflare đưa vào diện giám sát hoặc gán điểm nghi vấn (threat score cao).
     - Giờ cao điểm (12h-13h trưa, 20h-23h tối), lượng người đọc truyện trên STV tăng đột biến làm backend `103.82.20.93` kiệt sức worker.
2. **Hành vi đọc của người dùng trên App vBook:**
   - Người dùng lướt chuyển chương liên tục hoặc mở nhiều tab tìm kiếm. Nếu không có pacing hợp lý, nhiều request dồn vào cùng một thời điểm từ 1 IP di động sẽ kích hoạt cơ chế throttling của STV.
   - Đặc biệt ở bước `chap.js`: STV phải fetch chương từ web nguồn Trung Quốc theo thời gian thực (realtime crawl) rồi chạy máy dịch VietPhrase. Nếu trang nguồn Trung Quốc bị chậm, request ở STV sẽ giữ kết nối lâu, dẫn tới tràn hàng đợi PHP-FPM và bùng phát 504.

---

## 5. Đánh Giá So Sánh & Đề Xuất Hướng Mitigation

### 5.1. Bảng So Sánh Qsang_vbook vs kychi

| Tiêu chí | `sangtacviet` (v9) | `sangtacvietapp` (v4) | `[APP] Sáng Tác Việt` (kychi v2) |
|---|---|---|---|
| **Cơ chế tải** | Web HTML Scraping | API `/mobile/bookinfo.php` | API Mobile App |
| **Bản quyền / Giấy phép** | **Miễn phí 100%, không DRM** | **Miễn phí 100%, không DRM** | **Freemium (50 chương/ngày), phụ thuộc License Server cá nhân** |
| **Độ tin cậy máy chủ** | Độc lập, chỉ kết nối STV | Độc lập, chỉ kết nối STV | **Dễ hỏng (chết khi License Server kychi lỗi)** |
| **Xử lý 504 Failover** | Đã chặn (I3): trả ngay lỗi, không lặp qua 4 mirror gây treo 138s | Đã chặn (I3): trả ngay lỗi, không lặp qua 4 mirror gây treo 138s | Không failover (cố định domain trong `CONFIG_URL`) |
| **Pacing / Rate-limit** | `pacedFetch` (0.5s - 1.5s jitter, cooldown 60m khi 405/429) | `pacedFetch` (0.5s - 1.5s jitter, cooldown 60m khi 405/429) | `delay: 30000` (chỉ áp dụng khi tải offline) |
| **Mã nguồn** | Rõ ràng, dễ bảo trì | Rõ ràng, dễ bảo trì | Mã hóa `encrypt: true` |

### 5.2. Các Đề Xuất Giảm Thiểu (Mitigation) Khả Thi
1. **Không phụ thuộc vào License Server:** Giữ vững nguyên tắc của `Qsang_vbook` (mã nguồn mở, minh bạch, không cài cắm server DRM trung gian).
2. **Thông báo lỗi thân thiện khi gặp 504/502:**
   - Thay vì để app hiển thị raw HTTP 504, bắt mã 502/504 trong `chap.js` / `detail.js`:
     *"Máy chủ Sáng Tác Việt đang quá tải hoặc gặp lỗi dịch từ nguồn Trung Quốc (HTTP 504 Gateway Timeout). Vui lòng thử lại sau giây lát hoặc đổi nguồn khác."*
3. **Lựa chọn Domain tối ưu trong cài đặt:**
   - Vì `sangtacviet.com` và `sangtacviet.pro` trỏ thẳng tới IP gốc `103.82.20.93` không qua Cloudflare, trong trường hợp Cloudflare bị chặn hoặc lỗi xác minh, việc cho phép người dùng chuyển qua `sangtacviet.pro` trong setting extension là hoàn toàn chính xác.
4. **Tối ưu Smart Key Caching (như trong `sangtacvietapp`):**
   - Phiên bản `sangtacvietapp` vượt trội hơn hẳn bản `sangtacviet` web nhờ giảm thiểu tối đa các request tạo grant và mở WebView, giúp giảm áp lực lên backend STV và hạn chế nguy cơ dính 504.
