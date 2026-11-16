// toc.js — Muc luc (execute(url) -> [chuong]).
//
// Muc luc DAY DU tren trang chi tiet /book/<id>.html (khong phan trang
// — khong can page.js): ol#chapterList > li.w33p > a[href] > span.vam
// (kiem chung live 2026-11-16: sach mau 2 co 872 chuong, sach 106727
// co 114 chuong; so muc khop so chuong ghi tren trang).
// Link chuong dang tuyet doi /book/<id>/<n>.html (ch.1 = /book/2/11.html;
// /book/2/1.html la trang danh sach chuong phan trang, khong dung).
// SUA LOI CUA BASE Moleys v2: base lay e.select("a").text() tren chinh
// the a (khong co a long nhau) nen ten chuong tra rong — lay a.text()
// truc tiep. Base con gui truong host (da bo theo hop dong hien tai).
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeDmUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchDmDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    var links = doc.select("#chapterList li.w33p a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        var id = bookId(href);
        if (!id) continue;
        var m = href.match(/\/book\/(\d+)\/(\d+)\.html$/);
        if (!m) continue;
        var curl = BASE_URL + "/book/" + m[1] + "/" + m[2] + ".html";
        if (seen[curl]) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        seen[curl] = 1;
        items.push({ name: name, url: curl });
    }
    if (items.length === 0) return Response.error("Không đọc được mục lục.");
    return Response.success(items);
}
