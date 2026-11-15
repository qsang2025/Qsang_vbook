// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [{name, url}]).
//
// Muc luc DAY DU tren 1 trang /read/<id>/ (dang rut gon — khong can
// doan <cat> trong URL chuong): div.chapter-list a (kiem chung live
// 2026-11-16 voi 他怎么又不是人了？: 284 muc, va 全世界众筹复活本反派:
// 151 muc). Muc dau la 内容简介 (trang 1), tu muc 2 la chuong that —
// giu nguyen nhu danh sach cua site (tien le 52shuku: muc luc la danh
// sach trang). Muc luc khong phan trang nen khong co page.js.
// Base Moleys v1 lay ".view_content_list" cuoi cung — selector chet
// (trang moi khong con class do); viet lai quet thang .chapter-list.
// App goi toc.js bang URL chi tiet /txt/<id>.html (detail.js tra ve)
// nen phai suy ra /read/<id>/ truoc khi fetch; chap nhan ca dang
// /read/<id>/ truyen thang.
//
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
    var storyUrl = String(url || "");
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeStoryUrl(normalizeUrl(storyUrl));
    var readUrl = readUrlFromDetail(storyUrl);
    var r = fetchIjDoc(readUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".chapter-list a");
    if (links.size() === 0) {
        links = doc.select("a[href*='/read/']");
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
        // Chi lay link chuong /read/<cat>/<id>/<n>.html, bo link nav.
        if (href.indexOf("/read/") !== 0 && href.indexOf("read/") !== 0 &&
            href.indexOf("http") !== 0) continue;
        var full = absUrl(href);
        if (!full) continue;
        if (!/\/read\/\d+\/\d+\/\d+\.html?$/.test(full) &&
            !/\/read\/\d+\/\d+\.html?$/.test(full)) continue;
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
