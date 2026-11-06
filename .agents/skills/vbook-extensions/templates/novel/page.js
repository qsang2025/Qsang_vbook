// page.js — PHAN TRANG MUC LUC, tuy chon (template novel).
// Y tuong: Darkrai9x page.js. Chi khai bao trong plugin.json khi site chia
// muc luc cua mot truyen thanh nhieu trang. Tra ve mang URL cac trang muc
// luc theo thu tu; app se goi toc.js tren tung URL do.
// Neu site chi co 1 trang muc luc thi BO page.js khoi plugin.json.
// SELECTOR_TOC_PAGE_LINKS: doi thanh selector link phan trang that cua site.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var pages = [];
    var seen = {};
    doc.select("SELECTOR_TOC_PAGE_LINKS a").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        pages.push(link);
    });

    if (pages.length === 0) pages.push(url);
    return Response.success(pages);
}
