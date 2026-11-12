// toc.js — Muc luc chuong cua mot truyen QuanBen (quanben5.com).
//
// Trang muc luc `/n/<slug>/xiaoshuo.html` (HTML tinh, kiem chung live
// 2026-11-12): TOAN BO chuong trong 1 trang duy nhat — truyen mau
// 傲世丹神 co 3.813 muc / 3.818 chuong (thieu 5 chuong khong ton tai tren
// site). Moi muc: <ul class="list"><li class="c3"><a
// href="/n/<slug>/<n>.html"><span>第<n>章 ...</span></a></li>.
// KHONG can JSONP (khac giao dien cu quanben.io: list.html chi co 47 link
// + JSONP — xem helper.js). Sap theo so chuong trong URL de dam bao dung
// thu tu doc.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// So chuong trong URL chuong /n/<slug>/<n>.html (-1 neu khong co).
function chapterNum(href) {
    var m = String(href).match(/\/(\d+)\.html$/);
    if (!m) return -1;
    var n = parseInt(m[1], 10);
    return isNaN(n) ? -1 : n;
}

function execute(url) {
    var bookUrl = normalizeUrl(url);
    if (!bookUrl) return Response.error("Link truyện không hợp lệ.");
    if (bookUrl.charAt(bookUrl.length - 1) !== "/") bookUrl = bookUrl + "/";
    var tocUrl = bookUrl + "xiaoshuo.html";

    var r = fetchQBDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select("ul.list li.c3 > a").forEach(function (el) {
        var href = el.attr("href") || "";
        if (!href) return;
        var nameEl = safeFirst(el.select("span"));
        var name = nameEl !== null ? cleanText(nameEl.text()) : cleanText(el.text());
        if (!name) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({ name: name, url: link, description: "", lock: false, pay: false });
    });

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);

    // Sap theo so chuong trong URL de dung thu tu doc.
    chapters.sort(function (a, b) {
        var na = chapterNum(a.url);
        var nb = chapterNum(b.url);
        if (na === -1 && nb === -1) return 0;
        if (na === -1) return 1;
        if (nb === -1) return -1;
        return na - nb;
    });

    return Response.success(chapters);
}
