// genre.js — Danh sach the loai QuanBen (quanben5.com).
//
// Doc cac link the loai tu menu tren trang chu (a[href^="/category/"],
// 16 the loai: 1-15 + 18 — kiem chung live 2026-11-12). Moi muc tro ve
// book.js (renderer danh sach dung chung).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var r = fetchQBDoc(BASE_URL + "/");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var genres = [];
    var seen = {};
    doc.select("a[href^='/category/']").forEach(function (el) {
        var href = el.attr("href") || "";
        var m = href.match(/^\/category\/(\d+)\.html$/);
        if (!m) return;
        var id = m[1];
        if (seen[id]) return;
        seen[id] = true;
        var title = cleanText(el.text());
        if (!title) return;
        genres.push({ title: title, input: "/category/" + id + ".html", script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
