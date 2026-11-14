// search.js — Tim kiem: GET /tim-kiem?q=<tu khoa>&type=stories[&page=N].
// &page=1 bi site 301 ve khong co page nen chi them page khi > 1.
// Mo ta lay <p> cuoi trong article (p dau la dong "Tac gia: ...").
load("config.js");
load("rate-limit.js");

function encodeKey(key) {
    var q = String(key || "").trim();
    try {
        return encodeURIComponent(q).replace(/%20/g, "+");
    } catch (e) {
        return q.split(" ").join("+");
    }
}

function execute(key, page) {
    if (!key || String(key).trim() === "") return Response.error("Nhập từ khóa để tìm truyện");
    var url = BASE_URL + "/tim-kiem?q=" + encodeKey(key) + "&type=stories";
    var p = parseInt(page, 10);
    if (!isNaN(p) && p > 1) url += "&page=" + p;
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var articles = doc.select("section div.grid.gap-3 article");
    for (var i = 0; i < articles.size(); i++) {
        var art = articles.get(i);
        var aEl = selFirst(art, "h3 a");
        var name = aEl ? cleanText(aEl.text()) : "";
        var href = aEl ? aEl.attr("href") : "";
        if (!href || !name) continue;
        var imgEl = selFirst(art, "img");
        var cover = imgEl ? (imgEl.attr("src") || "") : "";
        var desc = "";
        var ps = art.select("p");
        if (ps.size() > 0) desc = cleanText(ps.get(ps.size() - 1).text());
        data.push({
            name: name,
            link: normalizeUrl(href),
            cover: normalizeUrl(cover),
            description: desc,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa \"" + String(key).trim() + "\"");
    return Response.success(data, nextPageToken(doc));
}
