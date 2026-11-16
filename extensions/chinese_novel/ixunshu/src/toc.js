// toc.js — Muc luc (execute(url) -> [{name, url}]).
//
// Trang /xs/<id>/zjml/1 (kiem chung live 2026-11-16): toan bo chuong
// nam trong #content_1 a (sach mau 乐可 23 chuong, 跑路失败 184 chuong),
// link dang /xs/<id>/zj/<cid>. Khong co #indexselect nen muc luc chi
// co 1 trang — page.js chi tra [url + "/zjml/1"].
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var target = normalizeIxUrl(url);
    if (!target) return Response.error("Đường dẫn truyện không hợp lệ.");
    var tocUrl = target.replace(/\/+$/, "") + "/zjml/1";
    var r = fetchIxDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var chapters = [];
    var seen = {};
    var links = doc.select("#content_1 a, #content_2 a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = cleanText(a.text());
        var href = String(a.attr("href") || "");
        if (!name || !href) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        if (link.indexOf("/zj/") === -1) continue;
        seen[link] = 1;
        chapters.push({ name: name, url: link });
    }
    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục.");
    }
    return Response.success(chapters);
}
