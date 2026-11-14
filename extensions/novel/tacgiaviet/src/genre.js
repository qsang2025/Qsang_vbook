// genre.js — Danh sach the loai (13 muc) tu trang /the-loai.
load("config.js");
load("rate-limit.js");

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/the-loai");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var cards = doc.select(".category-showcase-grid .category-showcase-card");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleEl = selFirst(card, ".category-showcase-body h2");
        var title = titleEl ? cleanText(titleEl.text()) : "";
        var linkEl = selFirst(card, ".category-showcase-link");
        var href = linkEl ? linkEl.attr("href") : "";
        if (!title || !href) continue;
        data.push({ title: title, input: normalizeUrl(href), script: "genreList.js", host: BASE_URL });
    }
    if (data.length === 0) return Response.error("Không tìm thấy danh sách thể loại");
    return Response.success(data);
}
