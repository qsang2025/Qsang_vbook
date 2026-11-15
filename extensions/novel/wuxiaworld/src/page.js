// page.js — Phan trang muc luc.
//
// Input: URL chi tiet truyen. Doc dong meta p.muted.small tren trang
// chi tiet de lay tong so chuong N ("· N chapters"), tinh so trang
// muc luc = ceil(N / 100) (moi trang ul.toc co 100 muc). Tra ve danh
// sach URL tuyet doi cac trang muc luc CON LAI (trang 2..N — trang 1
// toc.js da tra khi goi tren URL chi tiet). Truyen <= 100 chuong chi
// co 1 trang -> tra ve mang rong.
//
// Can than: so chuong trong meta la tong cua web chinh, co the lon hon
// so chuong that tren lite (Beyond the Zenith: meta 194, lite 190).
// ?toc vuot qua trang cuoi bi site kep ve trang cuoi nen page.js kiem
// chung trang cuoi: so link chuong dau tien cua ?toc=N voi ?toc=N-1,
// giong nhau thi bo trang cuoi. Neu khong doc duoc so chuong trong
// meta thi chi tra link "Next" neu co.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function firstTocLink(doc) {
    var a = selFirst(doc, "ul.toc li a");
    return a ? absUrl(a.attr("href")) : "";
}

function tocPageUrl(detailPath, n) {
    var base = detailPath;
    var qm = base.indexOf("?");
    if (qm !== -1) base = base.substring(0, qm);
    return absUrl(base + "?toc=" + n);
}

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var detailPath = url;
    var qm = detailPath.indexOf("?");
    if (qm !== -1) detailPath = detailPath.substring(0, qm);

    var total = 0;
    var meta = cleanText(doc.select("p.muted.small").text());
    if (meta) {
        var m = meta.match(/(\d+)\s*chapters/i);
        if (m) total = parseInt(m[1], 10);
    }
    if (!total || isNaN(total)) {
        // Du phong: chi tra link "Next" neu co.
        var nextLinks = doc.select("a[href*='?toc=']");
        for (var i = 0; i < nextLinks.size(); i++) {
            var t = cleanText(nextLinks.get(i).text());
            if (t.indexOf("Next") !== -1) {
                return Response.success([absUrl(nextLinks.get(i).attr("href"))]);
            }
        }
        return Response.success([]);
    }

    var pages = Math.ceil(total / 100);
    if (pages <= 1) return Response.success([]);

    // Kiem chung trang cuoi khong bi kep ve trang truoc.
    var lastDoc = null;
    var lastRr = ttlFetchDoc(tocPageUrl(detailPath, pages));
    if (!lastRr.error) lastDoc = lastRr.doc;
    if (lastDoc) {
        var lastFirst = firstTocLink(lastDoc);
        var prevFirst = "";
        if (pages - 1 === 1) {
            prevFirst = firstTocLink(doc);
        } else {
            var prevRr = ttlFetchDoc(tocPageUrl(detailPath, pages - 1));
            if (!prevRr.error) prevFirst = firstTocLink(prevRr.doc);
        }
        if (!lastFirst || (prevFirst && lastFirst === prevFirst)) {
            pages = pages - 1;
            if (pages <= 1) return Response.success([]);
        }
    }

    var out = [];
    for (var p = 2; p <= pages; p++) {
        out.push(tocPageUrl(detailPath, p));
    }
    return Response.success(out);
}
