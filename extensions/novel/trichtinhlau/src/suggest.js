// suggest.js — Goi y: truyen moi cap nhat (API, giong tab trang chu).
// Phan trang API hong phia server (?page=2 tra giong het trang 1 — xem
// ghi chu config.js) nen token trang ke luon "".
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(input, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var rr = ttlFetchJson(BASE_URL + "/api/newupdatestory?page=" + p);
    if (rr.error) return Response.success([], "");
    var json = rr.data || {};
    var data = json.data || [];
    var items = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var name = item.tentruyen || "";
        var slug = item.slug_post || "";
        if (!name || !slug) continue;
        var cover = item.image ? IMG_BASE + item.image : "";
        items.push({ name: name, link: "/xem-truyen/" + slug, host: BASE_URL, cover: cover, description: item.author || "" });
    }
    var next = "";
    return Response.success(items, next);
}
