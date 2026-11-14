// toc.js — Muc luc day du tren trang chi tiet, khong phan trang.
//
// Input: URL chi tiet truyen. Moi muc: #chapters-list a (title attr
// = ten chuong day du, text = ten chuong). Truyen mau 734 chuong
// trong 1 lan goi.
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
    var links = doc.select("#chapters-list a");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var name = cleanText(el.attr("title")) || cleanText(el.text());
        if (!name) continue;
        chapters.push({ name: name, url: link, host: BASE_URL });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục: " + url);
    return Response.success(chapters);
}
