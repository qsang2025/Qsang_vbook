// page.js — Tinh so trang cua muc luc chuong Truyen Hoan
// KHONG doi host cua link goc (xem config.js).
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v3, N1):
// fetch qua fetchPageDoc() (fetchDoc + kiem challenge, tra loi tieng Viet
// co huong dan khi gap Cloudflare/login).
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    var base = normalizeSiteUrl(url);
    if (!base) {
        return Response.error("Link truyện không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }
    if (base.charAt(base.length - 1) !== "/") base = base + "/";
    if (base.indexOf("/trang-") >= 0) {
        base = base.replace(/\/trang-\d+\/?(?:#.*)?$/, "/");
    }

    var r = fetchPageDoc(base);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pageCount = 1;
    doc.select("#list-chapter ul.pagination a").forEach(function(a) {
        var link = a.attr("href") || "";
        var match = link.match(/trang-(\d+)/i);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num > pageCount) pageCount = num;
        }
    });

    // Cap an toan 200 trang muc luc (10.000 chuong, 50 chuong/trang)
    // (N3). Truyen dai nhat kiem chung live 2026-11-09: Van Co Than De
    // 4.590 chuong = 92 trang; Pham Nhan Tu Tien ~50 trang. Cap 200 la
    // phong thu, chua co truyen nao cham; vuot cap thi chi sinh toi 200
    // URL va ghi log (khong bao loi). Neu gap truyen > 10.000 chuong thi
    // nang cap nay hoac phan trang toc qua page.js.
    var TOC_MAX_PAGES = 200;
    if (pageCount > TOC_MAX_PAGES) {
        console.log("page.js: pageCount " + pageCount + " vuot cap " + TOC_MAX_PAGES + ", chi sinh " + TOC_MAX_PAGES + " trang.");
        pageCount = TOC_MAX_PAGES;
    }

    if (base.charAt(base.length - 1) !== "/") base = base + "/";

    var pages = [];
    for (var i = 1; i <= pageCount; i++) {
        var pageUrl = base;
        if (i > 1) {
            pageUrl = base + "trang-" + i + "/";
        }
        pages.push(pageUrl);
    }

    return Response.success(pages);
}
