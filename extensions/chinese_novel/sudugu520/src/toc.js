// toc.js — Muc luc chuong (execute(url) -> danh sach chuong).
//
// Trang truyen /<id>/ (kiem chung live 2026-11-15 voi /102/):
// - Muc luc DAY DU trong #list (756 chuong, ch.1 -> ch.756 + 完本感言,
//   dung thu tu doc). Phan "最新三章节" (3 chuong moi nhat) nam NGOAI
//   #list nen chi quet #list a — khong cat, khong dedupe.
// - Link chuong dang tuong doi "/<id>/<chapid>.html" -> absUrl.
// - Muc luc khong phan trang nen khong co page.js.
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
    url = String(url || "");
    if (url.charAt(0) === "/") url = siteOrigin() + url;
    url = normalizeUrl(url);
    var r = fetchSgDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("#list a");
    if (links.size() === 0) {
        return Response.error("Không tìm thấy mục lục: " + url);
    }

    var data = [];
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var full = absUrl(href);
        if (!full) continue;
        data.push({
            name: name,
            url: full,
            host: siteOrigin()
        });
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + url);
    }
    return Response.success(data);
}
