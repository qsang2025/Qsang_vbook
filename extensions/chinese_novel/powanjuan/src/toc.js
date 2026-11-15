// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [{name, url}]).
//
// Muc luc DAY DU tren 1 trang chi tiet: div.catalog ul.clearfix li a
// (kiem chung live 2026-11-16 voi 无限之次元征服: 2460 chuong, va
// 这个学霸过于自律: 721 chuong — deu khop so trang "1/2460" / "1/721"
// tren trang chuong). Muc luc khong phan trang nen khong co page.js.
// Base Moleys v1 lay ".clearfix" cuoi cung roi moi li a — mong manh
// (trang co 4 khoi .clearfix); viet lai quet thang div.catalog.
// Luu y: hau to "(1-99)" trong h1 cua sach mau da cu (muc luc that co
// 2460 chuong) — khong dung h1 de dem chuong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var storyUrl = String(url || "");
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeStoryUrl(normalizeUrl(storyUrl));
    var r = fetchPwDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("div.catalog ul.clearfix li a");
    if (links.size() === 0) {
        links = doc.select("div.catalog li a");
    }
    if (links.size() === 0) {
        return Response.error("Không tìm thấy mục lục: " + storyUrl);
    }

    var data = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var full = absUrl(href);
        if (!full) continue;
        if (seen[full]) continue;
        seen[full] = true;
        data.push({
            name: name,
            url: full,
            host: siteOrigin()
        });
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + storyUrl);
    }
    return Response.success(data);
}
