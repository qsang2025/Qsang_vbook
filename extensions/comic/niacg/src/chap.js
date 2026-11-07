// chap.js — noi dung mot chuong (bo anh) cua NiACG: mang URL anh theo
// thu tu.
//
// Hai luong doc (kiem chung 2026-11-07):
//   Gallery (COS/本子/CG/套图/...): input /moeupup-<class>-<id>.html,
//     toan bo anh tren 1 trang, nam trong <img class="comic_img"
//     data-src="..."> (lazy-load). Vi du moeupup-1-162877 co 118 anh.
//   Chuong truyen tranh (日漫/韩漫, class 14/15): input la trang moehome
//     cua chuong /moehome-14-<id>.html. Trang moehome KHONG chua anh
//     chuong (chi co anh xem truoc/thumbnail lien quan) — phai tim nut
//     "开始阅读" (Bat dau doc, <a class="reading">) tro toi trang doc
//     /showinfo-16-<readId>-0.html, anh chuong nam trong
//     <img class="comic_img" data-src="..."> tren trang do (toan bo
//     chuong tren 1 trang; nut "下一页" tro toi chuong KE TIEP, khong
//     phai trang 2). Vi du chuong 101 -> showinfo-16-3935, 20 anh;
//     chuong 84 -> showinfo-16-3425.
// Neu nhan URL moehome cua gallery thi doi sang moeupup tuong ung.
// Anh noi dung nam tren CDN *.xunge.cyou:
//   gallery: https://boom.xunge.cyou/hen/YYYY/MM/DD/<folder>/<so>_<hash>.webp
//   manga:   https://comic.xunge.cyou/m1morepic/YYYY/MM/DD/HHMMSS/<hash>.jpg
// Loc bo: anh quang cao (cat.zhen.si, chmsrv.com, realsrv.com), anh giao
// dien (/skin/, logo, /media/categories/, /min/slt/), anh bia danh sach
// (/slthh/ — anh thumbnail cua item khac, khong phai trang chuong),
// placeholder (imgloading). Lazy-load: uu tien data-src truoc src.
// Khu trung theo URL, giu nguyen thu tu tren trang (anh danh so 0..N).
// Anh CDN bat buoc Referer niacg.com (403 neu thieu) — app tu dong gui
// Referer = URL chuong (cung domain niacg.com) khi tai anh truyen tranh.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function isContentImage(src) {
    if (!src) return false;
    if (src.indexOf("imgloading") !== -1) return false;
    if (src.indexOf("/skin/") !== -1) return false;
    if (src.indexOf("cat.zhen.si") !== -1) return false;
    if (src.indexOf("chmsrv.com") !== -1 || src.indexOf("realsrv.com") !== -1) return false;
    if (src.indexOf("/media/categories/") !== -1) return false;
    if (src.indexOf("/min/slt/") !== -1) return false;
    if (src.indexOf("/slthh/") !== -1) return false;
    if (src.indexOf("xunge.cyou") === -1) return false;
    return true;
}

// Lay anh chuong tu 1 trang doc: uu tien <img class="comic_img">
// (anh trang chuong, co data-src that), neu khong co thi lay toan bo
// anh noi dung tren trang (phuong an du phong khi site doi class).
function extractImages(doc) {
    var images = [];
    var seen = {};
    var comic = doc.select("img.comic_img");
    var useComic = false;
    comic.forEach(function (el) {
        var s = el.attr("data-src") || el.attr("src") || "";
        if (s && s.indexOf("imgloading") === -1) useComic = true;
    });
    var els = useComic ? comic : doc.select("img");
    els.forEach(function (el) {
        var src = el.attr("data-src") || el.attr("src") || "";
        if (!src) return;
        src = absImageUrl(src);
        if (!isContentImage(src)) return;
        if (seen[src]) return;
        seen[src] = true;
        // Ghi tuong minh referrerpolicy=origin vao URL anh (phan sau #
        // khong gui len server; app dung no de gui Referer la origin cua
        // site thay vi URL chuong day du). Anh CDN bat buoc Referer
        // niacg.com — truoc day nho Referer mac dinh cua app (URL chuong),
        // da kiem chung chay duoc; ghi ro ra de chac chan hon (them
        // 2026-11-07, theo cach cua ban Antigravity).
        images.push(src + "#referrerpolicy=origin");
    });
    return images;
}

function execute(url) {
    url = normalizeUrl(url);
    var classid = classIdOf(url);
    var id = itemIdOf(url);
    if (!classid || !id) return Response.error("Không đọc được mục/id từ URL: " + url);

    var readUrl = url;
    if (url.indexOf("/moehome-") !== -1) {
        if (isSeriesClass(classid)) {
            // Chuong truyen tranh: tim nut "开始阅读" tren trang moehome.
            var doc = fetchDocWithFallback(url);
            if (!doc) return Response.error("Không tải được chương: " + url);
            var reading = doc.select("a.reading").first();
            var href = reading ? (reading.attr("href") || "") : "";
            if (!href) {
                var alt = doc.select("a[href^=\"/showinfo-16-\"]").first();
                href = alt ? (alt.attr("href") || "") : "";
            }
            if (!href) {
                return Response.error("Không tìm thấy nút bắt đầu đọc trên trang chương (site có thể đã đổi giao diện): " + url);
            }
            readUrl = absUrl(href);
        } else {
            // Gallery: moehome -> moeupup (lay du bo anh).
            readUrl = moeupupUrl(classid, id);
        }
    }

    var readDoc = fetchDocWithFallback(readUrl);
    if (!readDoc) return Response.error("Không tải được trang đọc: " + readUrl);

    var images = extractImages(readDoc);
    if (images.length === 0) {
        return Response.error("Không đọc được ảnh chương (site có thể đã đổi giao diện): " + readUrl);
    }
    console.log("chap anh: " + images.length + " anh");
    return Response.success(images);
}
