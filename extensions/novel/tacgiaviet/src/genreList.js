// genreList.js — Danh sach truyen trong mot the loai (12 muc/trang).
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var fetchUrl = appendPage(normalizeUrl(url), page);
    var rr = ttlFetchDoc(fetchUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var items = doc.select(".category-story-list .category-story-item");
    for (var i = 0; i < items.size(); i++) {
        var el = items.get(i);
        var href = el.attr("href") || "";
        var nameEl = selFirst(el, ".category-story-copy strong");
        var name = nameEl ? cleanText(nameEl.text()) : "";
        if (!href || !name) continue;
        var imgEl = selFirst(el, ".category-story-cover img");
        var cover = imgEl ? (imgEl.attr("src") || "") : "";
        var descEl = selFirst(el, ".category-story-desc");
        data.push({
            name: name,
            link: normalizeUrl(href),
            cover: normalizeUrl(cover),
            description: descEl ? cleanText(descEl.text()) : "",
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không tìm thấy truyện trong thể loại này");
    return Response.success(data, nextPageToken(doc));
}
