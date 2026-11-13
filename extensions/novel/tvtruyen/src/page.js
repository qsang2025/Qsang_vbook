// page.js — Cac trang muc luc: muc luc phan trang 50 chuong/trang
// (?page=N). Tim so trang lon nhat trong .custom-pagination-list roi tra
// URL tung trang (trang 1 la URL goc).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url).split("#")[0];
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);

    var anchors = r.doc.select("#list-chapter .custom-pagination-list a, #mobile-list-chapter .custom-pagination-list a, .custom-pagination-list a, .pagination a");
    var lastPage = 1;
    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = String(a.attr("href") || "");
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var pNum = parseInt(m[1], 10);
            if (pNum > lastPage) lastPage = pNum;
        }
    }

    var data = [];
    for (var p = 1; p <= lastPage; p++) {
        if (p === 1) {
            data.push(url);
        } else {
            data.push(buildPageUrl(url, p));
        }
    }
    return Response.success(data);
}
