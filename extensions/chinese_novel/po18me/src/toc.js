// toc.js — muc luc day du tu /novel/list/<id>/1.html (1 trang tra het,
// khong phan trang). Trang chi tiet chi hien 10 chuong dau + 10 chuong cuoi
// nen khong dung no.
// Kiem chung live 2026-11-16 (寄生 105011): 223 muc, ch.1 第一章出访,
// chuong cuoi 第两百二十三章余温, khong trung lap.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);

    var idMatch = /\/novel\/([0-9]+)\.html/.exec(url);
    var listMatch = /\/novel\/list\/([0-9]+)\//.exec(url);
    var id = idMatch ? idMatch[1] : (listMatch ? listMatch[1] : "");
    if (!id) return Response.error("Không xác định được truyện");

    var r = fetchPoDoc(BASE_URL + "/novel/list/" + id + "/1.html");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapterPattern = new RegExp("/novel/" + id + "/[0-9]+\\.html");
    var seen = {};
    var chapters = [];
    var links = doc.select("ul li a[href]");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!chapterPattern.test(href)) continue;

        var name = cleanText(el.text());
        if (!name) continue;

        var full = absUrl(href);
        if (seen[full]) continue;
        seen[full] = true;

        chapters.push({
            name: name,
            url: full,
            description: "",
            lock: false,
            pay: false
        });
    }

    return Response.success(chapters);
}
