// genre.js — Danh sach the loai tu /the-loai.html (103 the loai sau dedup).
load("config.js");
load("rate-limit.js");

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/the-loai.html");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var seen = {};
    var genres = [];
    var links = doc.select("a.hydrosite-mong-truyen-categories-list-item-link");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = normalizeUrl(a.attr("href") || "");
        if (!href || seen[href]) continue;
        var titleEl = selFirst(a, ".hydrosite-mong-truyen-categories-list-item-link-text");
        var title = titleEl ? cleanText(titleEl.text()) : "";
        if (!title) {
            // Fallback: text trong <a> tru di hau to so luong "N truyen".
            title = cleanText(a.text()).replace(/\s*\d+\s*truy[eệ]n\s*$/i, "");
        }
        if (!title) continue;
        seen[href] = true;
        genres.push({ title: title, input: href, script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại: " + BASE_URL + "/the-loai.html");
    return Response.success(genres);
}
