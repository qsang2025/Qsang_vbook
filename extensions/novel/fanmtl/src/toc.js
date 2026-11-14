// toc.js — Muc luc: 1 trang fy.php tra 100 chuong.
//
// Input: URL trang muc luc /e/extend/fy.php?page=<N>&wjm=<slug> (page.js
// tra ve danh sach cac URL nay; app goi toc.js tren tung URL).
// Moi muc: ul.chapter-list li > a (strong.chapter-title = ten chuong).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var chapters = [];
    var seen = {};
    var links = doc.select("ul.chapter-list li a[href^=/novel/]");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var titleEl = selFirst(el, "strong.chapter-title");
        var noEl = selFirst(el, "span.chapter-no");
        var name = titleEl ? cleanText(titleEl.text()) : "";
        if (!name && noEl) name = "Chapter " + cleanText(noEl.text());
        if (!name) continue;
        chapters.push({ name: name, url: link, host: BASE_URL });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục: " + url);
    return Response.success(chapters);
}
