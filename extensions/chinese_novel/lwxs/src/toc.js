// toc.js — muc luc chuong cua mot truyen cua 乐文小说.
// URL mau: https://www.ilwxs.com/shu/41361/ (tu URL chi tiet
// /info-41361.html doi "/info-" -> "/shu/", ".html" -> "/").
// Trang muc luc co 1 <dl> duy nhat: 12 muc dau la khoi "chuong moi nhat"
// (xep moi truoc), sau do la toan bo chuong theo thu tu doc — cac muc o
// khoi dau lap lai o cuoi danh sach. De lay dung danh sach doc (khong
// phu thuoc do dai khoi dau), loai trung theo URL, giu lan xuat hien CUOI.
// Kiem chung live 2026-11-15: 259 muc <dd> -> 247 chuong (嫡嫁千金),
// muc dau tien sau khi loc: 第一章 芳菲.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    url = url.replace("/info-", "/shu/").replace(".html", "/");
    // FIX 2026-11-15: dung fetchDoc (xem chap.js) — fetchPage + .html()
    // crash khi fetchPage tra ve doi tuong browser-fallback {doc, ok: true}
    // hoac null (gap tren may that: HTTP 504 -> TypeError o .html()).
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục, thử lại sau");
    var links = doc.select("#list dl dd a");
    // Dem so lan xuat hien cua moi URL de chi giu lan cuoi cung.
    var counts = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = absUrl(links.get(i).attr("href"));
        counts[href] = (counts[href] || 0) + 1;
    }
    var seen = {};
    var chapters = [];
    // Duyet nguoc: lan gap dau tien tu cuoi chinh la lan cuoi cung.
    for (i = links.size() - 1; i >= 0; i--) {
        var el = links.get(i);
        var link = absUrl(el.attr("href"));
        var name = cleanText(el.text());
        if (!link || !name || seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }
    // Dao lai ve thu tu doc (chuong 1 -> chuong moi nhat).
    chapters.reverse();
    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
