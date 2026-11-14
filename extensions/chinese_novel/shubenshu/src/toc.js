// toc.js — Muc luc: GET /{id}_list/ tra toan bo chuong trong 1 lan.
//
// Luu y: trang muc luc co 1 link honeypot bot_test.php an (display:none,
// khong phai chuong that) — loc bo theo href khong co ".html" hoac co
// "bot_test". Khong can page.js (khong co phan trang muc luc).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/(l[A-Za-z0-9]+)\/?$/);
    if (!m) return Response.error("URL không hợp lệ");
    var rr = ttlFetchDoc(BASE_URL + "/" + m[1] + "_list/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var chapters = [];
    var links = doc.select("#list a[rel=chapter]");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href || href.indexOf(".html") === -1 || href.indexOf("bot_test") !== -1) continue;
        var name = cleanText(el.text());
        if (!name) continue;
        chapters.push({ name: name, url: href, host: BASE_URL });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục");
    return Response.success(chapters);
}
