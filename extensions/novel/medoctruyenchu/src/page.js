// page.js — Phan trang muc luc Me Doc Truyen Chu (medoctruyenchu.net).
//
// Muc luc phan trang theo ?page=N, 50 chuong/trang (kiem chung live
// 2026-11-14: truyen 177 chuong co 4 trang). Doc link phan trang trong
// .pagination__item a[data-url], lay so trang lon nhat, tra ve danh
// sach URL tuyet doi cua tat ca cac trang muc luc (tu ?page=1).
// execute(url).
load("config.js");
load("rate-limit.js");

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    detailUrl = detailUrl.replace(/\/+$/, "");
    detailUrl = detailUrl.replace(/[?&]page=\d+/, "");

    var r = mdcFetchDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var maxPage = 1;
    doc.select(".pagination__item a[data-url]").forEach(function (el) {
        var href = el.attr("data-url") || "";
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > maxPage) maxPage = n;
        }
    });

    var pages = [];
    for (var i = 1; i <= maxPage; i++) {
        pages.push(detailUrl + "?page=" + i);
    }
    return Response.success(pages);
}
