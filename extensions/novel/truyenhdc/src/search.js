// search.js — Tim kiem TruyenHD (truyenhdc.com).
//
// Form tim kiem cua site dung GET /tim-kiem/?title=<key> (SSR,
// li.col-md-6 trong .theloai-thumlist). Phan trang:
// /tim-kiem/page/<n>?title=<key> (link o ul.pagination).
// Kiem chung live 2026-11-14: "thu nhan" tra 29 ket qua (18 o
// trang 1, trang 2 co link /tim-kiem/page/2?title=thu+nhan).
// Tim kiem co dau / khong dau deu chay (kiem chung tren may that).
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    var q = String(key || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện.");
    var pageNum = parseInt(page || "1", 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var full = BASE_URL + "/tim-kiem/?title=" + encodeKey(q);
    if (pageNum > 1) {
        full = BASE_URL + "/tim-kiem/page/" + pageNum + "?title=" + encodeKey(q);
    }
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    doc.select(".theloai-thumlist .col-md-6").forEach(function (el) {
        var nameEl = selFirst(el, "h2 a");
        if (!nameEl) return;
        var name = cleanText(nameEl.text());
        if (!name) return;
        var href = nameEl.attr("href") || "";
        if (!href) return;
        var link = normalizeUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        var cover = "";
        var imgEl = selFirst(el, "a.thumbnail img");
        if (!imgEl) imgEl = selFirst(el, "img");
        if (imgEl) cover = normalizeUrl(imgEl.attr("data-src") || imgEl.attr("src") || "");
        var descEl = selFirst(el, ".content p");
        var desc = descEl ? cleanText(descEl.text()) : "";
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: desc,
            tag: "",
            host: BASE_URL
        });
    });
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa \"" + q + "\".");

    var next = "";
    var nextEl = selFirst(doc, "ul.pagination li.active + li a");
    if (nextEl) {
        var href = nextEl.attr("href") || "";
        var m = href.match(/\/page\/(\d+)/);
        if (m) next = m[1];
    }
    return Response.success(items, next);
}
