// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Muc luc DAY DU tren 1 trang chi tiet, khong phan trang (kiem chung
// live 2026-11-15: 紫狐归墟 /go/97746/ co 81 chuong trong
// #list-chapterAll, theo thu tu chuong 1 -> chuong cuoi). Muc
// "最新章节" phia tren trang trung lap 12 chuong moi — chi lay trong
// #list-chapterAll de tranh trung. href tuong doi dang "1.html" /
// "13036696.html", giai theo URL chi tiet (resolveChapUrl).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    if (detailUrl.slice(-1) !== "/") detailUrl = detailUrl + "/";
    var r = fetchBqDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    var links = doc.select("#list-chapterAll dd a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) continue;
        var link = resolveChapUrl(detailUrl, href);
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + detailUrl);
    return Response.success(chapters);
}
