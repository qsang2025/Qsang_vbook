// toc.js — Muc luc: 1 trang chi tiet tra 40 chuong.
//
// Input: URL chi tiet truyen (co the kem ?page=N — page.js tra ve cac
// URL trang muc luc). Moi muc: #list-chapter #idData li a.con
// (span.chapter-text = ten chuong).
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
    var links = doc.select("#list-chapter #idData li a.con");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var name = cleanText(el.select("span.chapter-text").text());
        if (!name) name = cleanText(el.text());
        if (!name) continue;
        chapters.push({ name: name, url: link, host: BASE_URL });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục: " + url);
    return Response.success(chapters);
}
