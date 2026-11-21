// page.js — PHAN TRANG MUC LUC (execute(url) -> [url trang muc luc]).
// Muc luc cua khotruyenchu.fun chia 50 chuong/trang, tren chinh trang detail:
//   Trang 1: /truyen/<slug>/
//   Trang N: /truyen/<slug>/page/N/
// So trang va URL goc nam trong <nav class="ct-pagination"
// data-max="32" data-base="<detail-url-co-dau-gach-cheo-cuoi>">.
// Luu y: data-base co dau "/" cuoi; runtime cat "/" cuoi cua URL truyen
// vao toc.js nen page.js lay base tu data-base thay vi tu URL dau vao.
// Khong dung ?order=desc trong URL trang (da kiem chung: /page/2/ khong
// tham so tra ch.51-100 theo thu tu tang dan).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("khotruyenchu.fun", 500, 1500);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var max = 0;
    var base = "";
    var nav = safeFirst(doc.select("nav.ct-pagination"));
    if (nav) {
        max = parseInt(String(nav.attr("data-max") || ""), 10);
        base = String(nav.attr("data-base") || "");
    }
    if (!base) base = url;
    if (base.charAt(base.length - 1) !== "/") base += "/";

    var pages = [];
    var seen = {};
    if (!max || isNaN(max) || max < 1) {
        // Fallback: quet link /page/N/ neu thieu data-max.
        var links = doc.select("nav.ct-pagination a[href]");
        var i = 0;
        for (i = 0; i < links.size(); i++) {
            var m = String(links.get(i).attr("href") || "").match(/\/page\/(\d+)\/?$/);
            if (m) {
                var n = parseInt(m[1], 10);
                if (!isNaN(n) && n > max) max = n;
            }
        }
    }
    if (!max || isNaN(max) || max < 1) return Response.success([base]);

    for (var n = 1; n <= max; n++) {
        var p = n === 1 ? base : base + "page/" + n + "/";
        if (!seen[p]) {
            seen[p] = true;
            pages.push(p);
        }
    }
    return Response.success(pages);
}
