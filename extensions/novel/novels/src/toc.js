// toc.js — muc luc chuong cua 繁體小說 (novels.com.tw).
// Toan bo chuong nam ngay tren trang chi tiet, KHONG phan trang nen khong
// can page.js. Trang co 2 khoi chuong:
//   .recent — ~12 chuong moi nhat, thu tu GIAM dan (bo qua)
//   #catalog .chapters — toan bo chuong, thu tu TANG dan tu chuong 1
// Selector chinh: #catalog .chapters a. Du phong (neu site doi cau truc):
// gom tat ca link chuong /novels/<slug>/<so>.html, dedupe theo URL roi
// sort tang dan theo so trong ten file.
// Ten chuong = text cua link (vd "第一章 開啟二周目").
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

// So thu tu chuong tu URL dang /novels/<slug>/<so>.html (dung de sort).
function chapterOrder(url) {
    var m = String(url || "").match(/\/(\d+)\.html/);
    return m ? parseInt(m[1], 10) : 0;
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var chapters = [];
    var seen = {};

    function addChapter(el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf(".html") === -1) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    // Khoi day du (tang dan).
    doc.select("#catalog .chapters a").forEach(addChapter);

    // Du phong: gom tat ca link chuong tren trang roi sort lai theo so.
    if (chapters.length === 0) {
        doc.select('a[href*="/novels/"]').forEach(addChapter);
        chapters.sort(function (a, b) {
            return chapterOrder(a.url) - chapterOrder(b.url);
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
