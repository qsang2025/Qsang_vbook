// toc.js — Muc luc chuong (execute(url) -> [{name, url}]).
//
// Trang truyen /novelnext/<slug>/ chua TOAN BO muc luc trong
// #tab-chapters (kiem chung live 2026-11-15): truyen 430 chuong co
// 432 link chapter (gom nut READ NOW trung chapter-1); truyen
// 1.503 chuong co 1.505 link — khong phan trang, khong can page.js.
// Ten chuong lay tu text cua link (so hien thi co the lech chi so
// URL, vd. chapter-430 = "Chapter 434 Unable to Escape" — giu
// nguyen text goc). Dedupe theo URL tuyet doi, giu thu tu doc.
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
    var detailUrl = absUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    var r = fetchNnDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("#tab-chapters a[href*=\"/chapter-\"]");
    if (links.size() === 0) {
        links = doc.select("a[href*=\"/chapter-\"]");
    }
    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href) continue;
        var full = absUrl(href);
        if (seen[full]) continue;
        seen[full] = true;
        var name = cleanText(a.text());
        if (!name) continue;
        chapters.push({ name: name, url: full });
    }
    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chương nào (site có thể đã đổi giao diện): " + detailUrl);
    }
    return Response.success(chapters);
}
