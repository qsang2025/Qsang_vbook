// toc.js — Muc luc Xa Lo Sach (xalosach.com).
// Input: URL trang chi tiet hoac URL trang muc luc (?P=N).
// Chuong nam trong #danhsachchuong ul.lst-chapter li.chap-item a
// (100 chuong/trang). Loai bo trung lap theo URL.

load("config.js");
load("rate-limit.js");

function execute(url) {
    var t = xlsFetchText(url, url);
    if (t.error) return Response.error(t.error);
    var doc = Html.parse(t.text);
    var scope = selFirst(doc, "#danhsachchuong");
    var els = null;
    if (scope) els = scope.select(".lst-chapter .chap-item a");
    if (!els || els.size() === 0) els = doc.select("#danhsachchuong a");
    var list = [];
    var seen = {};
    for (var i = 0; i < els.size(); i++) {
        var e = els.get(i);
        var href = e.attr("href");
        var name = cleanText(e.text());
        if (!href || !name) continue;
        if (href.indexOf("/doc-truyen/") === -1) continue;
        var full = absUrl(href);
        if (seen[full]) continue;
        seen[full] = true;
        list.push({ name: name, url: full, host: BASE_URL });
    }
    return Response.success(list);
}
