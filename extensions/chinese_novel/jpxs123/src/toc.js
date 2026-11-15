// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [{name, url}]).
//
// Muc luc DAY DU tren 1 trang chi tiet: div.book_list ul li a
// (kiem chung live 2026-11-15 voi 人在綜武，開始劇透人生: 403 link tho,
// chuong 1 xuat hien 2 lan — "線上閱讀" + "第1节" — nen dedupe theo URL
// con 402 chuong, dung thu tu doc). Muc luc khong phan trang nen
// khong co page.js.
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
    storyUrl = normalizeUrl(storyUrl);
    var r = fetchJxDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("div.book_list ul li a");
    if (links.size() === 0) {
        links = doc.select("div.book_list a[href$='.html']");
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
