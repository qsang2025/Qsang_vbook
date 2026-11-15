// toc.js — Muc luc chuong cua 1 trang indexlist (execute(url) -> chapters).
//
// App goi toc.js tren tung URL ma page.js tra ve (/indexlist/<id>/,
// /indexlist/<id>/2/...). Moi trang liet ke 100 chuong trong #list theo
// thu tu doc dung (kiem chung live 2026-11-16: trang 1 bat dau 第1章,
// ket thuc 第100章). Neu nhan truc tiep URL sach (/104461/) thi tu suy
// ra trang indexlist dau tien.
// Khong co khoa VIP / dang nhap; tat ca chuong deu doc duoc.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var tocUrl = String(url || "");
    if (tocUrl.charAt(0) === "/") tocUrl = siteOrigin() + tocUrl;
    tocUrl = normalizeUrl(tocUrl);
    if (tocUrl.indexOf("/indexlist/") === -1) {
        var m = tocUrl.match(/\/(\d+)\/?$/);
        if (!m) return Response.error("Không nhận ra id truyện trong URL: " + tocUrl);
        tocUrl = siteOrigin() + "/indexlist/" + m[1] + "/";
    }
    var r = fetchSkDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    var links = doc.select("#list a[rel=\"chapter\"]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
