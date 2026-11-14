// genrecontent.js — Danh sach truyen theo the loai: /the-loai/<slug>?page=N.
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var slug = String(url || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (!slug) return Response.error("Thiếu thể loại");
    var rr = ttlFetchDoc(BASE_URL + "/the-loai/" + slug + "?page=" + p);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var items = parseCards(doc);
    if (!items || items.length === 0) return Response.success([], "");
    return Response.success(items, getNextPage(doc, p));
}
