// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [{name, url}]).
//
// Muc luc DAY DU tren 1 trang chi tiet: div.book_list ul li a (kiem
// chung live 2026-11-16 voi 人在箱庭，是纯血龙种: 426 chuong, so
// 1..426 lien tuc, khong trung lap, dung thu tu doc). Muc luc khong
// phan trang nen khong co page.js. Luu y: hau to "(1-N)" trong ten sach
// tren trang chu co the da cu — khong dung ten sach de dem chuong.
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
    var r = fetchTrDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("div.book_list ul li a");
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
