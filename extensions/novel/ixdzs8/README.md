# 爱下电子书 (ixdzs8.com)

Extension truyện chữ tiếng Trung giản thể cho vBook — đọc **nguyên văn
tiếng Trung, không dịch máy** (quyết định của Anh từ v3 tiemtruyenchu_vip).

- **Site:** https://ixdzs8.com — 爱下电子书, miễn phí, không cần đăng nhập,
  không thấy chương VIP/khóa (không có VIP/付费/订阅/锁定 trên các trang
  đã kiểm tra). UTF-8, HTML SSR, không chống bot/Cloudflare với GET
  (curl từ VM trả HTTP 200).
- **Khảo sát live:** 2026-11-09 (curl từ VM + kiểm chứng trên máy thật
  theo test.json). Tài liệu thô: `/tmp/ixdzs8/*.html` (đã xóa sau khảo sát;
  số liệu dưới đây là bản ghi).
- **Mirror:** ixdzs.tw / ixdzs.hk (domain chị em của chính site, hreflang
  zh-Hant trên mọi trang — cùng đường dẫn, chỉ khác bản phồn thể/giản thể).

## Cấu trúc site (đã kiểm chứng)

| Chức năng | URL / selector |
|---|---|
| Trang chủ | `/` — các mục 热门排行 `/hot/`, 玄幻/都市/古言/言情推荐, 最近更新 `/new/` |
| Thể loại (15) | `/sort/<0-14>/` — 0 其他小说, 1 玄幻奇幻, 2 修真仙侠, 3 都市青春, 4 军事历史, 5 网游竞技, 6 科幻灵异, 7 言情穿越, 8 耽美同人, 9 台言古言, 10 武侠小说, 11 古典文学, 12 侦探推理, 13 外国文学, 14 当代现代 |
| Danh sách | `/new/`, `/hot/`, `/end/` (`?page=N`); `/sort/<id>/` (`/sort/<id>/index-0-0-0-<P>.html`); `/tags/<tag>` (`?page=N`). Cùng markup: `ul.u-list > li.burl[data-url="/read/<id>/"]`, `h3.bname a[title]`, `.bauthor`, `.size` (số chữ), `.lz` 连载中 / `.end` 已完结, `.l-p2` (giới thiệu), `.l-last .l-chapter` (chương mới nhất). 20 truyện/trang. Pager: `div.pagei a[title*="下一页"]` |
| Tìm kiếm | GET `/bsearch?q=<urlencoded>&page=<N>`, 20 kết quả/trang, cùng markup `li.burl`. Tìm `诡秘之主` = 3 trang, toàn truyện đồng nhân (hiển thị đúng tên như trang trả về, không tự lọc); tìm `剑来` ra đúng `剑来` đầu tiên |
| Trang sách | `/read/<id>/` — `h1` tên, `.n-img img` bìa (img22.ixdzs.com), `.n-text .bauthor` tác giả, `.n-text .nsort` thể loại, `.lz`/`.end` trạng thái, `.nsize` số chữ, link chương mới nhất, `p#intro.pintro` giới thiệu, `.tags em a[href^="/tags/"]` tag, `span.sub-text-r` `共<N>章` (số trang), `ul.u-chapter.cfirst` 20 chương mới nhất (thứ tự ngược), `input#bid` = id truyện, meta OG đầy đủ. Có link TXT `https://down7.ixdzs8.com/<id>.zip` (không dùng trong extension) |
| Mục lục đầy đủ | POST `/novel/html`, form `{bid: <id>}` → fragment `<li><a href="/read/<id>/p<N>.html">第X章…</a></li>` (thứ tự tăng dần). Xem cảnh báo bên dưới |
| Trang chương | `/read/<id>/p<N>.html` — `h1.page-d-name` tên chương, `article.page-content > h3` (tên lặp) + `section > <p>…</p>` sạch, không quảng cáo trong article. Nav `a.chapter-next` / `a.chapter-pre` (title = tên chương kế/trước). Vượt trang cuối → HTTP 301 |

## Hai điểm bắt buộc phải nhớ

### 1. Số trang p<N> KHÔNG bằng số chương — không tự tính

Đã kiểm chứng live 2026-11-09:

- Truyện 646492 `[诡秘之主]乌鸦童话`: p1 = 第1章, p2 = 第2章, p4 = 第4章,
  **p5 = 第6章 (第5章 không có trang nào)**, p50 = 第51章, p153 = 第154章
  (cuối). `共153章` = 153 trang.
- Truyện 167176 `剑来`: p1 = **第一章 惊蛰** (số chữ Hán), p1298 = 第76章 灯谜.
  `共1298章` = 1298 trang.

Vì vậy `toc.js` **chỉ dùng link chương thật** (từ AJAX hoặc từ trang sách),
giữ đúng thứ tự DOM, không sort theo số trong URL, không tự sinh tên chương.
`chap.js` trả `data2` = tên trong `<h1>` thật của trang chương (kể cả số chữ
Hán như 第一百章 — không đổi sang số Ả Rập).

### 2. POST mục lục timeout từ VM — cần test trên máy thật

POST `/novel/html` **timeout từ VM** (25–30 giây, 0 byte — cả ixdzs8.com lẫn
ixdzs.tw, có/không cookie, HTTP/1.1; GET `/novel/html?bid=` trả 200 0B).
Nghi server tar-pit POST từ IP datacenter. Chưa biết có chạy trên máy thật
không (fetch của app dùng OkHttp, IP điện thoại).

`toc.js` thử POST trên domain chính rồi từng mirror; nếu POST thất bại hết
thì **fallback sang 20 chương mới nhất** từ `ul.u-chapter.cfirst` trên trang
sách (đảo lại thành tăng dần). Truyện ngắn (≤ 20 chương) thì fallback là đủ;
truyện dài thì chỉ có 20 chương cuối cho tới khi POST chạy được. **Test trên
máy thật sẽ quyết định** — xem kết quả test trong file tiến độ
`~/workspace/vbook/work/ext-review/IXDZS8-PROGRESS.md`.

## Truyện mẫu (test.json)

- 646492 `[诡秘之主]乌鸦童话` — 布可菽, 其他, 连载中, 52.42万字, 153 trang,
  mới nhất 第154章 (p153). Chương p50 = 第51章, nội dung bắt đầu
  `我深吸了一口气…`.
- 167176 `剑来` — 烽火戏诸侯, 玄幻奇幻, 连载中, 1298 trang, mới nhất
  第76章 灯谜 (p1298). Chương p1 = 第一章 惊蛰.

## File trong extension

```
extensions/novel/ixdzs8/
  plugin.json  (author MuseAi, version 1, type novel, locale zh_CN)
  icon.png     (apple-touch-icon của site, 180x180)
  test.json    (golden fixture — truyện thật 646492, 167176)
  health.json  (fixture nhẹ cho CI probe)
  README.md    (file này)
  src/
    config.js           (BASE_URL https://ixdzs8.com, mirror ixdzs.tw/.hk)
    config-helpers.js   (lib chung, copy từ lib/ — md5 khớp gốc)
    fetch-helpers.js    (lib chung, copy từ lib/ — md5 khớp gốc)
    cleanHtml.js        (lib chung, copy từ lib/ — md5 khớp gốc)
    helper.js           (parseBookRow, parseBookRows, nextPagePath, htmlDecode)
    home.js             (8 tab tĩnh → book.js)
    genre.js            (15 thể loại tĩnh → book.js)
    book.js             (renderer danh sách chung; token = path trang kế)
    search.js           (GET /bsearch?q=&page=)
    detail.js           (.novel + OG meta; genres = thể loại + tags → book.js)
    toc.js              (POST /novel/html + fallback 20 chương mới nhất)
    chap.js             (article.page-content; data2 = <h1> thật)
```

Không dùng `page.js` (mục lục không phân trang theo kiểu page.js — AJAX trả
toàn bộ một lần; fallback 20 chương không cần phân trang).
