// page.js — Tinh so trang cua muc luc chuong (execute(url) -> [url]).
//
// Muc luc phan trang 100 chuong/trang: trang 1 la trang chi tiet,
// trang N la /<slug>/index_<N>.html (kiem chung live 2026-11-15:
// 绝境黑夜 624 chuong = 7 trang, link index_1..index_7; 万族之劫
// 1006 chuong = 11 trang). Ham nay doc link phan trang tren trang
// chi tiet, lay so trang lon nhat, tra ve day du cac URL trang muc
// luc (tuyet doi) de app goi toc.js tung trang theo thu tu.
// Trang chi tiet tra 200 tu VM; trang index_<N>.html co luc tra 502
// Cloudflare tu IP datacenter (gap 3 lan lien tuc 2026-11-15) —
// test tren may that se xac nhan.
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
    var slug = bookSlug(url);
    if (!slug) return Response.error("Link truyện không hợp lệ.");
    var base = detailUrlOf(url);
    if (!base) return Response.error("Link truyện không hợp lệ.");
    var r = fetchMtDoc(base);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pageCount = 1;
    var links = doc.select(".pages ul.pagination a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/index_(\d+)\.html$/);
        if (m) {
            var num = parseInt(m[1], 10);
            if (num > pageCount) pageCount = num;
        }
        // Chi bao "1/7" o nut disabled cung cho tong so trang.
        var t = cleanText(links.get(i).text());
        var tm2 = t.match(/^(\d+)\/(\d+)$/);
        if (tm2) {
            var tot = parseInt(tm2[2], 10);
            if (tot > pageCount) pageCount = tot;
        }
    }
    // Phong thu: tieu de "第1章~100章/共N章" cho tong so chuong.
    if (pageCount === 1) {
        var titleText = cleanText(doc.text());
        var tm = titleText.match(/共(\d+)章/);
        if (tm) {
            var total = parseInt(tm[1], 10);
            var calc = Math.ceil(total / 100);
            if (calc > pageCount) pageCount = calc;
        }
    }

    // Cap an toan 100 trang muc luc (10.000 chuong). Truyen dai nhat
    // kiem chung live 2026-11-15: 万族之劫 1006 chuong = 11 trang.
    var TOC_MAX_PAGES = 100;
    if (pageCount > TOC_MAX_PAGES) {
        console.log("page.js: pageCount " + pageCount + " vuot cap " + TOC_MAX_PAGES + ", chi sinh " + TOC_MAX_PAGES + " trang.");
        pageCount = TOC_MAX_PAGES;
    }

    var pages = [];
    for (i = 1; i <= pageCount; i++) {
        var pageUrl = base;
        if (i > 1) {
            pageUrl = base + "index_" + i + ".html";
        }
        pages.push(pageUrl);
    }
    return Response.success(pages);
}
