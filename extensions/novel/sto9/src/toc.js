// toc.js — muc luc chuong cua 思兔閱讀 (sto9.com).
// DAC BIET: trang /book/{id}/index.html CHI chua 36 link (15 dau
// li[data-num="1"–"15"] + 21 cuoi li[data-num="853"–"873"]), KHONG phan
// trang. Full list o endpoint AJAX:
//   GET https://sto9.com/ajax_novels/chapterlist/{id}.html
// (khao sat 2026-11-07: 200, text/html UTF-8, ~104KB, fragment <ul> du
// 873 <li data-num="1..873">, moi item <a href="/txt/{id}/{cid}.html">,
// khong chuong khoa/VIP). toc.js PHAI fetch endpoint AJAX nay; trang
// index chi lam fallback dau/cuoi.
// Vi du: 夜無疆 id 671 — 873 muc = 870 chuong danh so + 1 muc cam on
// + 2 muc "休息一天". Chuong 1: 第1章 永夜 -> /txt/671/83151.html;
// chuong cuoi 第870章 -> /txt/671/9247693.html. ID chuong la so mo
// (83151 cho chuong 1) — KHONG sort theo so trong URL, giu dung thu
// tu DOM. Khong can page.js.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/book\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var chapters = [];
    var seen = {};

    function addChapter(el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf("/txt/") === -1) return;
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

    // Nguon chinh: endpoint AJAX tra full list (gi du thu tu DOM).
    var ajaxUrl = BASE_URL + "/ajax_novels/chapterlist/" + bookId + ".html";
    var doc = fetchDocWithFallback(ajaxUrl);
    if (doc) {
        doc.select("li a").forEach(addChapter);
    }

    // Fallback: trang index (chi 36 link dau/cuoi).
    if (chapters.length === 0) {
        var indexUrl = BASE_URL + "/book/" + bookId + "/index.html";
        var doc2 = fetchDocWithFallback(indexUrl);
        if (doc2) {
            doc2.select("ul.row a").forEach(addChapter);
            if (chapters.length === 0) {
                doc2.select('a[href*="/txt/"]').forEach(addChapter);
            }
        }
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
