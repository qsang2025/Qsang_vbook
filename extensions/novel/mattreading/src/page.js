// page.js — Tinh so trang cua muc luc chuong (execute(url) -> [url]).
//
// Muc luc phan trang 10 chuong/trang: trang 1 la trang truyen,
// trang N la /<slug>/page/<N>/ (kiem chung live 2026-11-15:
// Tyrant 885 chuong = 89 trang, link /page/2/ ... /page/89/).
// Ham nay doc link phan trang tren trang truyen, lay so trang lon nhat,
// tra ve day du cac URL trang muc luc de app goi toc.js tung trang.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var novel = novelByUrl(url);
    if (!novel) return Response.error("Link truyện không hợp lệ.");
    var base = absUrl(novel.url);
    var r = fetchMrDoc(base);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pageCount = 1;
    var links = doc.select(".pagination a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/\/page\/(\d+)\/?(?:\?|$)/);
        if (m) {
            var num = parseInt(m[1], 10);
            if (num > pageCount) pageCount = num;
        }
    }

    // Cap an toan 200 trang muc luc (2.000 chuong). Truyen dai nhat
    // kiem chung live 2026-11-15: Tyrant 885 chuong = 89 trang.
    var TOC_MAX_PAGES = 200;
    if (pageCount > TOC_MAX_PAGES) pageCount = TOC_MAX_PAGES;

    var pages = [];
    for (i = 1; i <= pageCount; i++) {
        var pageUrl = base;
        if (i > 1) {
            pageUrl = base + "page/" + i + "/";
        }
        pages.push(pageUrl);
    }
    return Response.success(pages);
}
