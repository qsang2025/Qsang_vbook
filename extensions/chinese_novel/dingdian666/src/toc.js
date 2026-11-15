// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Muc luc DAY DU tren 1 trang chi tiet, khong phan trang (kiem chung
// live 2026-11-15: 天师神医 4990 muc, thu tu tang dan ch.1 ->
// ch.5038, link duy nhat; 大周第一武夫 1186 muc). Cau truc:
// .border_chapter ul li a (ten chuong + href /zhangjie/<id>/<cid>.html).
// Bo trung theo href (phong thu), giu thu tu gap dau tien.
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
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/xiaoshuo/" + id + "/";
    var r = fetchDdDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".border_chapter ul li a");
    if (links.size() === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + detailUrl);
    }

    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + detailUrl);
    }
    return Response.success(chapters);
}
