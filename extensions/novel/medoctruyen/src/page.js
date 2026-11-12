// page.js — Phan trang muc luc Me Doc Truyen (medoctruyen.vn).
//
// Muc luc phan trang theo ?ch=N, 24 chuong/trang (kiem chung live
// 2026-11-12: truyen 202 chuong co 9 trang). Doc link phan trang trong
// section#danh-sach-chuong, lay so trang lon nhat, tra ve danh sach URL
// tuyet doi cua tat ca cac trang muc luc (tu ?ch=1). execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    detailUrl = detailUrl.replace(/\/+$/, "");

    var r = fetchMdDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var maxPage = 1;
    doc.select("section#danh-sach-chuong a[href*=\"?ch=\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        var m = href.match(/[?&]ch=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > maxPage) maxPage = n;
        }
    });

    var pages = [];
    for (var i = 1; i <= maxPage; i++) {
        pages.push(detailUrl + "?ch=" + i);
    }
    return Response.success(pages);
}
