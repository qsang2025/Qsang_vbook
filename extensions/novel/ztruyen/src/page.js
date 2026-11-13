// page.js — Cac trang muc luc: muc luc phan trang 52 chuong/trang qua
// AJAX theme_get_chaps. Doc so chuong moi nhat N tu nut .btn-latest
// tren trang chi tiet roi tra ceil(N/52) URL dang /<slug>?ztpage=K
// (toc.js doc tham so ztpage roi POST 1 trang AJAX). Trang cuoi luon
// chua chuong moi nhat N nen khong rong. Neu khong trich duoc N thi
// tra 1 trang.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url).split("#")[0].split("?")[0];
    if (url.charAt(url.length - 1) !== "/") url += "/";
    var r = fetchZtruyenPage(url);
    if (r.error) return Response.error(r.error);

    var latestNum = extractLatestChapterNum(r.doc);
    var pages = 1;
    if (latestNum > 0) pages = Math.ceil(latestNum / 52);

    var data = [];
    for (var p = 1; p <= pages; p++) {
        data.push(url + "?ztpage=" + p);
    }
    return Response.success(data);
}
