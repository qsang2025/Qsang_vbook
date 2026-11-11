// toc.js — Muc luc chuong cua mot truyen AzTruyen.
//
// Trang chi tiet chi liet ke chuong trong div#chapters ul.chapters
// (kiem chung live 2026-11-11): moi muc la li.listc a, ten chuong day du
// trong text (VD "Chương 601: Chuẩn bị phía sau", "Part 6"), URL dang
// /<slug>-<id>/chuong-N-<tieu-de>-<id>/ hoac /<slug>-<id>/part-N-<id>/.
// LUU Y GIOI HAN CUA SITE: danh sach nay TOI DA 200 chuong moi nhat —
// truyen dai hon (VD 800 chuong) chi hien chuong 601–800, khong co API
// hay trang phan trang nao lay duoc chuong cu hon (nut prev o chuong dau
// danh sach bi vo hieu hoa; da thu ?page=2, /trang-2/,
// /danh-sach-chuong/, sitemap — deu khong co). Nen KHONG can page.js;
// toc.js tra ve dung nhung gi site liet ke.
// (Co them 1 danh sach "chuong moi nhat" 5 muc o tren trang — nam NGOAI
// div#chapters nen selector duoi day khong lay trung.)
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");
    if (tocUrl.charAt(tocUrl.length - 1) !== "/") tocUrl = tocUrl + "/";

    var r = fetchAzDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select("#chapters ul.chapters li.listc a").forEach(function (el) {
        var href = el.attr("href") || "";
        var name = cleanText(el.text());
        if (!href || !name) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);

    // Sap xep tang dan theo so chuong trong ten ("Chương 601: ..." -> 601,
    // "Part 6" -> 6). Danh sach tren trang xep chuong moi nhat len truoc
    // (5 chuong moi nhat roi moi den danh sach day du) nen khong sap thi
    // thu tu doc bi dao lon. Sap on dinh: muc khong co so giu nguyen vi
    // tri tuong doi, xep cuoi.
    var decorated = [];
    var di = 0;
    for (di = 0; di < chapters.length; di++) {
        var nm = chapters[di].name.match(/(\d+)/);
        var num = nm ? parseInt(nm[1], 10) : 0;
        if (isNaN(num)) num = 0;
        decorated.push({ item: chapters[di], num: num, idx: di });
    }
    decorated.sort(function (a, b) {
        var an = a.num === 0 ? 1000000000 + a.idx : a.num;
        var bn = b.num === 0 ? 1000000000 + b.idx : b.num;
        if (an !== bn) return an - bn;
        return a.idx - b.idx;
    });
    var sorted = [];
    var si = 0;
    for (si = 0; si < decorated.length; si++) sorted.push(decorated[si].item);
    return Response.success(sorted);
}
