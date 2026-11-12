// page.js — Phan trang muc luc AkayTruyen (akaytruyen.com).
//
// Muc luc 50 chuong/trang (kiem chung live 2026-11-13: truyen 3.752
// chuong co 76 trang, truyen 501 chuong co 11 trang). Trang chi tiet mac
// dinh liet ke moi nhat truoc; them ?old_first=1 de doi sang cu nhat
// truoc, phan trang bang ?old_first=1&page=N. So trang lon nhat doc tu
// #main-chapter-pagination (link .story-ajax-paginate[data-url] chua
// page=N) hoac input.input-paginate[max]. Tra ve danh sach URL tuyet doi
// cua tat ca cac trang muc luc (tu ?old_first=1&page=1). execute(url).
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
    var detailUrl = normalizeUrl(url).replace(/\/+$/, "").replace(/[?#].*$/, "");
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    var base = detailUrl + "?old_first=1";

    var r = fetchAkDoc(base);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var maxPage = 1;
    doc.select("#main-chapter-pagination a[data-url]").forEach(function (el) {
        var href = el.attr("data-url") || el.attr("href") || "";
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > maxPage) maxPage = n;
        }
    });
    var jump = safeFirst(doc.select("#main-chapter-pagination input.input-paginate"));
    if (jump !== null) {
        var mx = parseInt(jump.attr("max") || "0", 10);
        if (mx > maxPage) maxPage = mx;
    }

    var pages = [];
    var i = 0;
    for (i = 1; i <= maxPage; i++) {
        pages.push(base + "&page=" + i);
    }
    return Response.success(pages);
}
