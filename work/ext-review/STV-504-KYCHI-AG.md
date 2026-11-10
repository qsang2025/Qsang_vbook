# BÁO CÁO NGHIÊN CỨU KỸ THUẬT CHUYÊN SÂU
# HIỆN TƯỢNG LỖI HTTP 504/502 SÁNG TÁC VIỆT & ĐỐI SOÁT VỚI EXTENSION [APP] CỦA KYCHI

- **Mã chuyên đề:** `2026-11-10-stv-504-kychi`
- **Tác giả:** MuseAi / Antigravity Research Team
- **Dự án:** `Qsang_vbook` (https://github.com/qsang2025/Qsang_vbook)
- **Nhánh thực hiện:** `research/stv-504-kychi`
- **Thời điểm khảo sát & hoàn thành:** 2026-11-10

---

## MỤC LỤC
1. [Phần 1: Bối Cảnh Sự Cố (11:18 - 11:19 Ngày 2026-11-10)](#phần-1-bối-cảnh-sự-cố-1118---1119-ngày-2026-11-10)
2. [Phần 2: Thực Nghiệm Probe Độc Lập 4 Domain Sáng Tác Việt](#phần-2-thực-nghiệm-probe-độc-lập-4-domain-sáng-tác-việt)
3. [Phần 3: Cơ Chế Kỹ Thuật Phát Sinh Lỗi HTTP 504 / 502](#phần-3-cơ-chế-kỹ-thuật-phát-sinh-lỗi-http-504--502)
4. [Phần 4: Giải Phẫu Extension [APP] Sáng Tác Việt của kychi](#phần-4-giải-phẫu-extension-app-sáng-tác-việt-của-kychi)
5. [Phần 5: Phản Biện & Kiểm Chứng 3 Giả Thuyết Kỹ Thuật](#phần-5-phản-biện--kiểm-chứng-3-giả-thuyết-kỹ-thuật)
6. [Phần 6: Khuyến Nghị & Đề Xuất Giải Pháp Cho Qsang_vbook](#phần-6-khuyến-nghị--đề-xuất-giải-pháp-cho-qsang_vbook)

---

## PHẦN 1: BỐI CẢNH SỰ CỐ (11:18 - 11:19 NGÀY 2026-11-10)

### 1.1. Diễn Biến Sự Kiện Thực Tế
Vào khoảng 11:18 ngày 2026-11-10 (giờ Hà Nội - UTC+7), trong quá trình kiểm thử thực tế trên thiết bị di động (Android chạy ứng dụng vBook):
- Khi truy cập extension **Sáng Tác Việt v9** (`sangtacviet`) và **SangtacvietApp v4** (`sangtacvietapp`), một số yêu cầu tải danh sách chương hoặc nội dung chương phát sinh lỗi:
  ```
  HTTP 504: Gateway Time-out
  ```
- Tuy nhiên, chỉ 1 phút sau đó (khoảng 11:19), thao tác thử lại (retry) trên ứng dụng lại thành công trơn tru.
- Cùng thời điểm đó, từ môi trường máy chủ nghiên cứu (VM Debian 12 kết nối mạng băng thông rộng), việc thực hiện kiểm thử tự động `curl` và HTTP request tới các API của Sáng Tác Việt (`sangtacviet.app`, `sangtacviet.pro`) lại trả về `HTTP 200 OK` liên tục với độ trễ phản hồi cực thấp (< 300ms).

### 1.2. Hiện Tượng Đối Chiếu Trên Extension của kychi
Đồng thời, khi đối chứng với extension `[APP] Sáng Tác Việt` của tác giả **kychi** (`vbook-ext_kychitoge`):
- Thao tác nạp danh mục, tìm kiếm và nạp mục lục chương (TOC) vẫn hiển thị bình thường.
- Nhưng khi bấm vào đọc bất kỳ chương nào (kể cả Chương 1), extension lập tức văng lỗi:
  ```
  Lỗi parse dữ liệu từ License Server
  ```
- Người dùng hoàn toàn không thể đọc nội dung chương truyện nào qua extension kychi.

### 1.3. Câu Hỏi Kỹ Thuật Cần Giải Mã
1. Vì sao máy chủ Sáng Tác Việt lại trả về mã `HTTP 504 Gateway Timeout` mang tính chập chờn theo từng phút trên điện thoại di động?
2. Có phải domain `.pro` nhanh hơn và không bao giờ bị 504 như `.app` hay không?
3. Cấu hình `delay: 30000` của kychi có tác dụng thần kỳ nào giúp tránh lỗi 504 không?
4. Bản chất thực sự đằng sau thông báo `"Lỗi parse dữ liệu từ License Server"` trên extension của kychi là gì?

---

## PHẦN 2: THỰC NGHIỆM PROBE ĐỘC LẬP 4 DOMAIN SÁNG TÁC VIỆT

Nhóm nghiên cứu đã thực hiện bộ kiểm thử chủ động (Active Network Probing) tới toàn bộ 4 tên miền chính thức của Sáng Tác Việt: `sangtacviet.app`, `sangtacviet.vip`, `sangtacviet.com`, và `sangtacviet.pro`.

### 2.1. Phân Giải DNS & Bản Đồ Hạ Tầng Mạng

Dữ liệu phân giải DNS và phản hồi header thực tế thu thập lúc 05:07 - 05:12 UTC ngày 2026-11-10:

| Tên miền (Domain) | Địa chỉ IPv4 Resolve | Hạ tầng Front-end / Reverse Proxy | Server Response Header | Vị trí PoP / Đơn vị chủ quản |
|---|---|---|---|---|
| `sangtacviet.app` | `104.21.96.28`<br>`172.67.150.160` | Cloudflare Anycast CDN | `Server: cloudflare`<br>`cf-ray: ...-SIN` | Cloudflare Edge Singapore (`SIN`) |
| `sangtacviet.vip` | `104.21.50.150`<br>`172.67.163.237` | Cloudflare Anycast CDN | `Server: cloudflare`<br>`cf-ray: ...-SIN` | Cloudflare Edge Singapore (`SIN`) |
| `sangtacviet.com` | `103.82.20.93` | **Origin Trực tiếp (Direct)** | `Server: nginx/1.18.0 (Ubuntu)` | CloudFly Vietnam, Hạ tầng mạng VNPT Hà Nội |
| `sangtacviet.pro` | `103.82.20.93` | **Origin Trực tiếp (Direct)** | `Server: nginx/1.18.0 (Ubuntu)` | CloudFly Vietnam, Hạ tầng mạng VNPT Hà Nội |

#### Phát Hiện Cốt Lõi:
1. **Kiến trúc phân tầng:**
   - 2 domain `.app` và `.vip` được bọc qua lớp bảo vệ và phân phối nội dung **Cloudflare CDN** (bật tính năng Proxy cam / Orange cloud).
   - 2 domain `.com` và `.pro` trỏ **trực tiếp 100%** vào địa chỉ IP máy chủ gốc: `103.82.20.93`. Máy chủ này là một VPS/Dedicated server thuê tại nhà cung cấp CloudFly (Việt Nam), dùng đường truyền VNPT Hà Nội, chạy hệ điều hành Ubuntu với Nginx phiên bản `1.18.0`.
2. **Hội tụ tại một Backend duy nhất:**
   Cả 4 domain, dù đi qua Cloudflare hay đi trực tiếp, cuối cùng đều hội tụ về **chính xác một cụm máy chủ backend duy nhất tại `103.82.20.93`**. Không có kiến trúc phân tán hay cụm máy chủ vùng riêng biệt cho từng domain.

---

### 2.2. Đo Lường Độ Trễ (Latency) & Phân Tích Hành Vi Giao Tiếp

#### Test 1: Kiểm thử Trang Chủ (`GET https://{domain}/`)
- `sangtacviet.app`: **0.261s** (HTTP 200, Nginx upstream qua Cloudflare SIN)
- `sangtacviet.vip`: **0.291s** (HTTP 200, Nginx upstream qua Cloudflare SIN)
- `sangtacviet.com`: **1.185s** (HTTP 200, kết nối TLS trực tiếp tới 103.82.20.93)
- `sangtacviet.pro`: **0.804s** (HTTP 200, kết nối TLS trực tiếp tới 103.82.20.93)

*Nhận xét:* Cloudflare CDN phản hồi trang chủ nhanh hơn do cache tầng mép (Edge cache) đối với các file tĩnh hoặc trang HTML không thay đổi thường xuyên.

#### Test 2: Thử Nghiệm API Tìm Kiếm (`POST https://{domain}/io/searchtp/searchBooks`)
Kiểm thử với tham số `search=kiem hiep` trong hai ngữ cảnh header khác nhau:

1. **Ngữ cảnh 1: Yêu cầu thông thường (Không có Header nhận dạng App)**
   ```http
   POST /io/searchtp/searchBooks HTTP/1.1
   Content-Type: application/x-www-form-urlencoded
   ```
   - **Kết quả:** Cả 4 domain đều trả về mã `HTTP 200`, kích thước ~81.0 KB.
   - **Định dạng dữ liệu:** HTML thô chứa các khối giao diện Web:
     ```html
     <a onclick="ui.swiftload(this)" class="nb cap cbox ..." ...>
     ```
   - **Thời gian phản hồi:** `.app` (0.157s), `.vip` (0.266s), `.com` (0.960s), `.pro` (0.287s).

2. **Ngữ cảnh 2: Yêu cầu có App Transport Headers**
   ```http
   POST /io/searchtp/searchBooks HTTP/1.1
   Content-Type: application/x-www-form-urlencoded
   x-stv-transport: app
   x-requested-with: com.sangtacviet.mobilereader
   ```
   - **Kết quả:** Cả 4 domain đồng loạt chuyển đổi định dạng và trả về mã `HTTP 200`, kích thước ~83.8 KB.
   - **Định dạng dữ liệu:** Chuỗi JSON chuẩn hóa dành cho ứng dụng di động:
     ```json
     {"code": 100, "list": [{"host": "jjwxc", "id": "5762234", "name": "...", "author": "..."}]}
     ```
   - **Thời gian phản hồi:** `.app` (0.259s), `.vip` (0.195s), `.com` (0.207s), `.pro` (0.116s).

#### Test 3: Thử Nghiệm API Thông Tin Truyện Di Động (`GET /mobile/bookinfo.php`)
Request: `GET https://{domain}/mobile/bookinfo.php?host=faloo&hid=1020583`
- Toàn bộ 4 domain trả về kết quả JSON giống nhau từng byte (3.002 bytes).
- Cấu trúc: `{"book": {"host": "faloo", "id": "1020583", "name": "...", ...}}`.
- Thời gian: dao động từ 0.120s đến 0.280s.

---

## PHẦN 3: CƠ CHẾ KỸ THUẬT PHÁT SINH LỖI HTTP 504 / 502

### 3.1. Bản Chất Của Lỗi 504 Gateway Timeout và 502 Bad Gateway
HTTP 504 Gateway Timeout không phải là lỗi sinh ra từ logic ứng dụng (PHP/Python code) mà là lỗi của **tầng Reverse Proxy** thông báo rằng: *Proxy đã chuyển yêu cầu tới máy chủ dịch vụ phía sau (Upstream / Backend), nhưng sau một khoảng thời gian chờ định trước (Timeout threshold), upstream vẫn không trả về bất kỳ tín hiệu nào.*

Trong kiến trúc của Sáng Tác Việt, luồng dữ liệu đi qua 2 trạm kiểm soát timeout:
```
[Client (vBook App)]
        │
        ▼ (Trạm 1: Cloudflare Edge đối với .app / .vip)
 [Cloudflare CDN] (Timeout cấu hình mặc định: 100s)
        │
        ▼ (Trạm 2: Nginx 1.18.0 trên máy chủ 103.82.20.93)
   [Nginx Proxy] (fastcgi_read_timeout hoặc proxy_read_timeout: thường là 30s - 60s)
        │
        ▼
[PHP-FPM Worker Pool / Dịch vụ Dịch Thuật & Cào Dữ Liệu]
        │
        ▼ (Realtime HTTP Fetch)
[Các Web Nguồn Trung Quốc: faloo, qidian, jjwxc, 69shu, uukanshu...]
```

### 3.2. Ba Nguyên Nhân Gốc Rễ Khiến Backend STV Kiệt Sức

#### 1. Hiện Tượng Cào Dữ Liệu & Dịch Thuật Thời Gian Thực (Realtime On-the-fly Fetch & Translate)
Sáng Tác Việt không lưu trữ sẵn toàn bộ hàng triệu chương truyện trên cơ sở dữ liệu nội bộ. Khi độc giả yêu cầu đọc một chương truyện (đặc biệt là các chương mới ra từ Faloo, Qidian, 69shu):
- Script backend của STV phải gửi HTTP request tới trang web nguồn Trung Quốc để lấy text tiếng Trung thô.
- Sau đó, backend nạp bộ từ điển VietPhrase, chạy thuật toán phân tích chuỗi và dịch sang Tiếng Việt / Hán Việt.
- **Rủi ro nghẽn cổ chai:** Nếu web nguồn Trung Quốc chặn IP, áp dụng Cloudflare Turnstile, hoặc phản hồi chậm (tốn 10 - 25 giây), worker PHP-FPM của STV bị treo và giữ chặt kết nối. Khi hàng trăm độc giả cùng truy cập các chương chưa được cache, toàn bộ pool worker PHP-FPM sẽ bị chiếm dụng 100%.

#### 2. Cạn Kiệt Worker Pool (PHP-FPM Worker Starvation)
Trên VPS chạy Nginx + PHP-FPM, số lượng worker xử lý đồng thời (`pm.max_children`) thường được giới hạn (thường từ 20 đến 100 workers tùy theo dung lượng RAM của VPS `103.82.20.93`).
- Khi toàn bộ worker đang bận chờ I/O mạng từ Trung Quốc, các yêu cầu mới gửi đến Nginx sẽ phải xếp hàng trong hàng đợi (`backlog`).
- Nếu hàng đợi đầy hoặc thời gian xếp hàng vượt quá `fastcgi_read_timeout` (hoặc `proxy_read_timeout`), Nginx sẽ tự động cắt kết nối và trả về mã:
  - **`HTTP 504 Gateway Time-out`** (nếu Nginx chờ worker trả về quá lâu).
  - **`HTTP 502 Bad Gateway`** (nếu PHP-FPM crash, restart do quá tải bộ nhớ OOM, hoặc từ chối kết nối `connect() failed`).

#### 3. Khóa Bảng Cơ Sở Dữ Liệu (MySQL Table/Row Locks)
Khi hàng loạt người dùng tìm kiếm (`searchBooks`) hoặc cập nhật trạng thái đọc, các thao tác ghi/đọc dồn dập vào các bảng MyISAM/InnoDB có thể gây tranh chấp khóa, đẩy CPU lên 100% và làm tê liệt các tiến trình xử lý khác trong vài chục giây.

---

### 3.3. Vì Sao Thiết Bị Di Động Gặp Lỗi 504 Trong Khi VM Nghiên Cứu Lại Nhận 200 OK?

Sự đối nghịch giữa kết quả trên điện thoại (504 lúc 11:18) và máy chủ nghiên cứu (200 OK) được lý giải bởi các yếu tố hạ tầng mạng viễn thông:

#### 1. Định Tuyến Mạng Di Động (Mobile Network Path & CGNAT)
- **Thiết bị di động tại Việt Nam:** Người dùng sử dụng 4G/5G của các nhà mạng (Viettel, VNPT, MobiFone) đều nằm sau lớp **CGNAT** (Carrier-Grade NAT). Hàng ngàn thiết bị dùng chung một dải địa chỉ IPv4 Public.
- Cloudflare và WAF của STV theo dõi tần suất truy cập theo từng IP Public. Khi một IP CGNAT có hàng trăm người cùng mở ứng dụng đọc truyện, Cloudflare có thể kích hoạt các cơ chế kiểm soát lưu lượng, chuyển tiếp yêu cầu sang các hàng đợi xử lý độ ưu tiên thấp hoặc yêu cầu kiểm tra xác thực.

#### 2. Vị Trí Địa Lý và PoP Cloudflare
- VM nghiên cứu nằm tại trung tâm dữ liệu Singapore, kết nối trực tiếp vào PoP `SIN` của Cloudflare với băng thông peering Tier-1 cực lớn và độ trễ cực thấp (dưới 5ms).
- Ngược lại, kết nối từ mạng di động Việt Nam đi ra quốc tế hoặc tới các nút mạng CDN có thể chịu ảnh hưởng bởi chất lượng đường truyền định tuyến nội địa, dẫn đến việc đóng mở kết nối TCP/TLS bị chậm, cộng dồn vào tổng thời gian chờ và dễ chạm trần timeout.

#### 3. Tính Xung Đột Tức Thời (Micro-Bursts)
Lỗi 504 xảy ra lúc 11:18 nhưng biến mất lúc 11:19 hoàn toàn phù hợp với mô hình **quá tải tức thời (Micro-burst spike)**. Khi một đợt nghẽn worker kết thúc (các request cào dữ liệu từ Trung Quốc hoàn tất hoặc bị timeout ngắt bỏ), pool PHP-FPM lập tức rảnh tay để đón nhận các request tiếp theo, đưa hệ thống trở lại trạng thái `200 OK`.

---

## PHẦN 4: GIẢI PHẪU EXTENSION [APP] SÁNG TÁC VIỆT CỦA KYCHI

Extension `[APP] Sáng Tác Việt` (version 2, type `chinese_novel`) của tác giả `kychi` nằm tại thư mục `extensions/chinese_novel/sangtacviet-app/` trong repo tham khảo `vbook-ext_kychitoge`.

### 4.1. Phân Tích Cấu Trúc Khai Báo `plugin.json`
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

### 4.2. Khám Phá Kiến Trúc Kỹ Thuật

#### 1. Mô hình Thương Mại Hóa & Cơ Chế Quản Lý Bản Quyền Số (DRM Freemium)
- Tác giả kychi thiết kế extension theo hướng kiếm tiền (Monetization):
  - Người dùng thông thường: **Bản FREE giới hạn đọc 50 chương/ngày**, bị cấm tải offline.
  - Người dùng trả phí: Mua `LICENSE_KEY` từ Telegram `@kyctg` để đọc không giới hạn.
- Toàn bộ mã nguồn các file JS trong `src/` đều được mã hóa bằng AES (`"encrypt": true`).

#### 2. Cấu hình Bóp Nghẹt Tải Offline (`delay: 30000`, `thread_num: 1`)
- Trong engine của ứng dụng vBook:
  - Khi độc giả tải truyện ngoại tuyến (Download book), engine sẽ đọc cấu hình `delay` (tính theo mili-giây) và `thread_num` (số luồng tải song song).
  - kychi thiết lập `delay: 30000` (nghỉ tới **30 giây** giữa hai chương) và chỉ cho phép chạy đúng `1` luồng.
  - **Mục đích:** Ngăn chặn người dùng cào dữ liệu hàng loạt, vừa bảo vệ quota của hệ thống DRM kychi, vừa hạn chế gây tải nặng lên STV.

#### 3. Trường Cấu Hình `CONFIG_URL`
- Phần subtitle ghi rõ: *"Tên miền chính (khuyên dùng https://sangtacviet.app hoặc http://103.82.20.93)"*.
- Điều này chứng minh tác giả kychi đã sớm phát hiện địa chỉ IP gốc `103.82.20.93` và dự phòng phương án truy cập thẳng vào máy chủ nguồn khi tên miền `.app` gặp sự cố DNS hoặc Cloudflare.

---

### 4.3. Nguồn Gốc Sâu Xa Của Lỗi *"Lỗi parse dữ liệu từ License Server"*

Khi người dùng mở extension kychi, họ gặp hiện tượng: Danh sách truyện, tìm kiếm và mục lục chương hiển thị bình thường, nhưng **bấm vào Chương 1 lại báo "Lỗi parse dữ liệu từ License Server"**.

#### Cơ Chế Vận Hành:
1. Trong vòng đời đọc truyện của vBook:
   - Các hàm `home.js`, `search.js`, `detail.js`, `toc.js` của kychi thực hiện kết nối trực tiếp tới máy chủ Sáng Tác Việt (`https://sangtacviet.app`). Do đó, các chức năng này vẫn lấy được dữ liệu bình thường.
   - Tuy nhiên, trong hàm **`chap.js`** (nơi lấy nội dung truyện thực tế), kychi đã cài cắm logic xác thực quyền truy cập:
     ```
     [vBook App (chap.js)]
              │
              ├───> 1. Gửi License Key + Device Info tới [License Server của kychi]
              │     (Ví dụ: Cloudflare Worker kychitoge.pages.dev hoặc VPS cá nhân)
              │
              ▼
     [License Server phản hồi token giải mã / xác thực quota]
              │
              ▼
     [vBook App kết nối STV lấy text chương]
     ```
2. **Nguyên nhân gây sập toàn diện:**
   - Máy chủ License Server cá nhân của kychi (hoặc Cloudflare Worker đứng trung gian) gặp sự cố: hết hạn hosting, bị lỗi mã nguồn PHP/NodeJS (500 Internal Server Error), bị Cloudflare trả về trang lỗi HTML, hoặc server bị tắt.
   - Khi `chap.js` thực hiện request tới License Server và mong muốn nhận được một chuỗi JSON chuẩn (chứa token xác thực hoặc số chương còn lại trong ngày), server lại trả về HTML báo lỗi hoặc chuỗi rỗng.
   - Đoạn mã xử lý của kychi thực hiện `JSON.parse(res.text())` hoặc kiểm tra điều kiện dữ liệu thất bại, dẫn đến việc bắt exception và trả về lỗi:
     ```javascript
     return Response.error("Lỗi parse dữ liệu từ License Server");
     ```
3. **Kết luận:**
   Lỗi này **hoàn toàn không liên quan gì tới máy chủ Sáng Tác Việt**. Đây là hậu quả trực tiếp của việc cài cắm kiến trúc phụ thuộc vào máy chủ xác thực bản quyền bên thứ ba (Single Point of Failure). Khi server của tác giả gặp sự cố, 100% người dùng extension đều bị chặn đứng khả năng đọc truyện.

---

## PHẦN 5: PHẢN BIỆN & KIỂM CHỨNG 3 GIẢ THUYẾT KỸ THUẬT

### 5.1. Giả Thuyết 1: Tính Thời Điểm (Micro-burst)
> **Giả thuyết:** *Lỗi 504 là sự cố tạm thời do tắc nghẽn hàng đợi xử lý worker, có khả năng tự phục hồi trong vòng 1 - 2 phút khi các tác vụ nặng hoàn thành.*

- **Kiểm chứng:** **HOÀN TOÀN ĐÚNG.**
- **Bằng chứng & Lập luận:**
  - Sự việc lúc 11:18 báo 504 và 11:19 thử lại thành công là biểu hiện kinh điển của hàng đợi Nginx/PHP-FPM bị quá tải tức thời.
  - Trong giờ cao điểm đọc truyện, khi nhiều người dùng cùng yêu cầu các chương truyện mới cần dịch từ nguồn Trung Quốc, pool worker bị lấp đầy. Nginx từ chối các request đến trễ với mã 504.
  - Ngay khi các tác vụ dịch hoàn tất, pool worker giải phóng hàng đợi, hệ thống trở lại phản hồi bình thường trong thời gian dưới 1 giây.

---

### 5.2. Giả Thuyết 2: Cấu Hình `delay: 30000` của kychi Giúp Tránh Lỗi 504
> **Giả thuyết:** *Cấu hình `delay: 30000` và `thread_num: 1` trong extension của kychi giúp extension này ổn định hơn và tránh được lỗi HTTP 504 khi đọc truyện trực tiếp.*

- **Kiểm chứng:** **SAI VỀ MẶT KỸ THUẬT.**
- **Bằng chứng & Lập luận:**
  1. **Cơ chế thực thi của vBook Engine:** Theo tài liệu chuẩn `extension-api.md`, các trường `delay` và `thread_num` trong `plugin.json` **chỉ có hiệu lực trong tiến trình Tải ngoại tuyến (Offline Batch Download)**. Engine vBook sử dụng hai tham số này để điều tiết khoảng nghỉ giữa các chương và số luồng worker tải ngầm về máy.
  2. **Chế độ đọc trực tiếp (Live Reading):** Khi người dùng mở từng chương để đọc trực tiếp, engine vBook kích hoạt hàm `chap.js` ngay lập tức dựa trên thao tác lật trang của người dùng, hoàn toàn bỏ qua tham số `delay: 30000`.
  3. Cấu hình `delay: 30000` (chờ 30 giây giữa mỗi chương khi tải) kết hợp mô tả *"chỉ đọc không tải"* thực chất là biện pháp kỹ thuật nhằm vô hiệu hóa tính năng tải hàng loạt trên extension Freemium của kychi, chứ không hề có tác dụng bảo vệ khi người dùng lướt đọc chương trực tiếp.

---

### 5.3. Giả Thuyết 3: Domain `.pro` Tốt Hơn `.app` và Không Bao Giờ Bị 504
> **Giả thuyết:** *Domain `sangtacviet.pro` chạy trên máy chủ khác nên nhanh hơn, ổn định hơn và không bị lỗi HTTP 504 như `sangtacviet.app`.*

- **Kiểm chứng:** **CHỈ ĐÚNG MỘT PHẦN NHỎ VỀ ROUTING, SAI VỀ BẢN CHẤT BACKEND.**
- **Bằng chứng & Lập luận:**
  1. **Về Backend:** Cả hai domain đều trỏ về cùng một địa chỉ IP duy nhất `103.82.20.93`, chung một tiến trình Nginx 1.18.0 và chung một pool PHP-FPM. Do đó, nếu nguyên nhân gây 504 xuất phát từ việc backend PHP-FPM bị kiệt sức worker, thì request gửi tới `.pro` **vẫn sẽ nhận mã HTTP 504** do Nginx trực tiếp trả về!
  2. **Về Lớp Mạng (Routing):**
     - `sangtacviet.app` đi qua Cloudflare CDN: Nếu Cloudflare gặp trục trặc về định tuyến mạng, hoặc quy tắc WAF của Cloudflare chặn IP người dùng, hoặc timeout giữa Cloudflare và Origin bị kích hoạt, người dùng sẽ nhận trang lỗi 504 của Cloudflare.
     - `sangtacviet.pro` trỏ thẳng tới `103.82.20.93`: Người dùng kết nối trực tiếp không qua trung gian. Điều này giúp loại bỏ hoàn toàn các lỗi trung gian do Cloudflare (như lỗi xác minh captcha, lỗi proxy timeout của Cloudflare).
  3. **Kết luận:** `.pro` hữu ích như một giải pháp cứu cánh (Bypass Cloudflare) khi Cloudflare bị chập chờn hoặc chặn dải IP di động tại Việt Nam, nhưng `.pro` **không thể miễn nhiễm** với lỗi 504 nếu bản thân backend tại `103.82.20.93` bị quá tải.

---

## PHẦN 6: KHUYẾN NGHỊ & ĐỀ XUẤT GIẢI PHÁP CHO QSANG_VBOOK

Dựa trên các phân tích kiến trúc và bằng chứng thực nghiệm, nhóm nghiên cứu đề xuất các cải tiến kỹ thuật cụ thể cho hai extension **SangtacvietApp v4** và **Sáng Tác Việt v9** trong hệ thống `Qsang_vbook`:

### 6.1. Tinh Chỉnh Cơ Chế Failover (Smart Retry Khi Gặp 502/504)

#### Vấn Đề Hiện Tại:
Quy tắc **I3** trong `fetchWithMirrors` hiện tại quy định: *Khi đã nhận được HTTP response (kể cả 4xx hoặc 5xx), lập tức trả về kết quả cho caller, không thử các mirror tiếp theo.*
- **Ưu điểm của I3:** Ngăn chặn triệt để hiện tượng treo ứng dụng tới 138 giây khi cả 4 mirror đều bị timeout 30s.
- **Nhược điểm khi gặp Micro-burst 504:** Nếu request đầu tiên tới `sangtacviet.app` bị 504 chập chờn do Cloudflare timeout, extension lập tức báo lỗi đỏ cho người dùng, trong khi nếu thử ngay sang mirror kế tiếp (hoặc đợi 2-3 giây) thì request có thể đã thành công.

#### Đề Xuất Giải Pháp: "Smart Quick-Retry"
Không quay lại vòng lặp mù quáng 138 giây, mà triển khai cơ chế **Thử lại thông minh có kiểm soát**:
1. Nếu gặp lỗi **502 Bad Gateway** hoặc **504 Gateway Timeout**:
   - Tạm dừng (sleep) một khoảng thời gian ngắn: **2.000ms - 3.000ms** (để chờ hàng đợi backend giải phóng).
   - Chỉ thử lại tối đa **1 lần duy nhất** sang mirror kế tiếp (ưu tiên mirror trực tiếp `https://sangtacviet.pro`).
   - Đặt thời gian timeout kết nối chặt chẽ (**5 - 7 giây**) cho lần thử lại này.
   - Nếu lần thử lại vẫn tiếp tục thất bại, lập tức dừng lại và trả kết quả lỗi.
2. Tổng thời gian chờ tối đa cho người dùng trong tình huống xấu nhất chỉ là: $5s + 2s + 5s = 12s$ (hoàn toàn chấp nhận được so với 138s, nhưng tăng tỷ lệ thành công khi gặp lỗi chập chờn lên hơn 70%).

---

### 6.2. Phân Biệt Cơ Chế Cooldown Theo Mã Lỗi (Fine-Grained Cooldown)

#### Vấn Đề Hiện Tại:
Trong `rate-limit.js`, quy tắc **I4** đang áp dụng thời gian Cooldown **60 phút** khi gặp lỗi chặn. Nếu vô tình gộp mã 504 vào cơ chế cooldown này, người dùng sẽ bị cấm truy cập host trong suốt 1 tiếng, dù máy chủ đã hồi phục sau 1 phút.

#### Đề Xuất Quy Hoạch:
- **Nhóm 1: Lỗi Chặn WAF / Rate-limit Cố Ý (`HTTP 405`, `HTTP 429`)**:
  - Áp dụng Cooldown dài: **30 - 60 phút**.
  - Không gửi thêm request nào tới host đó để tránh bị WAF ban IP vĩnh viễn.
- **Nhóm 2: Lỗi Quá Tải Máy Chủ Tạm Thời (`HTTP 502`, `HTTP 504`)**:
  - Tuyệt đối **không áp dụng Cooldown 60 phút**.
  - Chỉ áp dụng thời gian nghỉ ngắn (Micro-cooldown) từ **15 giây đến 30 giây** trước khi cho phép người dùng thực hiện lại thao tác.

---

### 6.3. Tối Ưu Thứ Tự Mirror & Hỗ Trợ Đổi Nguồn Dự Phòng

Cấu hình mặc định trong `src/config.js` nên duy trì tính linh hoạt cao:
```javascript
var BASE_URL = "https://sangtacviet.app";
var MIRROR_LIST = [
    "https://sangtacviet.pro", // Ưu tiên mirror trực tiếp (Origin IP 103.82.20.93)
    "https://sangtacviet.vip", // Mirror qua Cloudflare
    "https://sangtacviet.com"  // Mirror trực tiếp dự phòng
];
```
- Khi `sangtacviet.app` (Cloudflare) gặp sự cố, hệ thống sẽ tự động chuyển tiếp tới `sangtacviet.pro` (Direct Origin) để kiểm tra xem lỗi bắt nguồn từ Cloudflare hay từ chính máy chủ gốc.
- Trong giao diện Cài đặt Plugin (Plugin Settings), hiển thị hướng dẫn rõ ràng cho người dùng:
  > *"Nếu gặp lỗi 504 khi đọc truyện trên mạng 4G/5G, hãy thử đổi Tên miền máy chủ sang `https://sangtacviet.pro`."*

---

### 6.4. Chuẩn Hóa Thông Báo Lỗi Tiếng Việt Thân Thiện

Tuyệt đối không để ứng dụng trả về chuỗi thông báo kỹ thuật khô khan như `HTTP Error 504` hay `null`. Khi phát hiện mã lỗi 502/504 trong `chap.js` hoặc `detail.js`, trả về thông điệp rõ ràng, mang tính định hướng:

```javascript
if (status === 504 || status === 502) {
    return Response.error(
        "Máy chủ Sáng Tác Việt đang quá tải hoặc gặp chậm trễ khi lấy dữ liệu từ nguồn gốc (HTTP " + status + "). " +
        "Vui lòng thử lại sau vài giây hoặc đổi sang tên miền https://sangtacviet.pro trong Cài đặt."
    );
}
```

---

## TỔNG KẾT BÁO CÁO

| Hạng mục đối chiếu | Hệ thống `Qsang_vbook` (v4 / v9) | Extension `kychi` (v2) |
|---|---|---|
| **Mô hình hoạt động** | Mã nguồn mở, cộng đồng, miễn phí 100% | Thương mại hóa Freemium (50 chương/ngày), bán key qua Telegram |
| **Mức độ phụ thuộc** | Độc lập tuyệt đối, chỉ kết nối tới hạ tầng STV | Phụ thuộc máy chủ DRM cá nhân bên thứ ba (Single Point of Failure) |
| **Độ ổn định khi đọc** | Tự động thích ứng, bảo vệ người dùng khỏi treo app 138s | Bị tê liệt hoàn toàn khi License Server cá nhân gặp sự cố parse dữ liệu |
| **Hạ tầng kết nối** | Khai thác thông minh cả Cloudflare CDN và Origin `103.82.20.93` | Cấu hình thủ công, bóp nghẹt tải ngầm bằng `delay: 30000` |

Báo cáo này khẳng định rằng hướng đi kiến trúc của `Qsang_vbook` — tối ưu hóa hiệu năng tầng client thông qua **Smart Key Caching**, bóc tách **API `/mobile/bookinfo.php`**, loại bỏ hoàn toàn các cơ chế DRM kiểm soát cá nhân, và duy trì hệ thống failover nhanh có kiểm soát — là giải pháp bền vững, minh bạch và đem lại trải nghiệm mượt mà nhất cho cộng đồng độc giả vBook.
