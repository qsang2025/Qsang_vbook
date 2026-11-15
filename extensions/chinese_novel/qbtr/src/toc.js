// toc.js — Muc luc (execute(url) -> [chuong]).
//
// Muc luc DAY DU tren trang chi tiet (khong phan trang — khong can
// page.js): div.book_list ul li a -> /<cat>/<id>/<n>.html, text " 第N节"
// (kiem chung live 2026-11-16: sach 10047 co 1.205 chuong).
// Link dau tien la "在线阅读" tro ve ch.1 — TRUNG voi muc 第1节 nen
// dedupe theo URL (giu muc co ten 第N节). Bo link khong co text.
// URL chuong la tuong doi — tuyet doi hoa ve BASE_URL.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeQbUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchQbDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    var links = doc.select("div.book_list ul li a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        var m = href.match(/^\/(tongren|changgui)\/(\d+)\/(\d+)\.html$/);
        if (!m) continue;
        var curl = BASE_URL + "/" + m[1] + "/" + m[2] + "/" + m[3] + ".html";
        if (seen[curl]) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        seen[curl] = 1;
        items.push({ name: name, url: curl });
    }
    if (items.length === 0) return Response.error("Không đọc được mục lục.");
    return Response.success(items);
}
