// bookList.js — Danh sach truyen o trang /truyen (12 muc/trang).
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var fetchUrl = appendPage(normalizeUrl(url), page);
    var rr = ttlFetchDoc(fetchUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var rows = doc.select(".stories-library-list .stories-library-row");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var aEl = selFirst(row, ".stories-library-copy h2 a");
        var name = aEl ? cleanText(aEl.text()) : "";
        var href = aEl ? aEl.attr("href") : "";
        if (!href || !name) continue;
        var imgEl = selFirst(row, "a.stories-library-cover img");
        var cover = imgEl ? (imgEl.attr("src") || "") : "";
        var descEl = selFirst(row, ".stories-library-copy > p");
        data.push({
            name: name,
            link: normalizeUrl(href),
            cover: normalizeUrl(cover),
            description: descEl ? cleanText(descEl.text()) : "",
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không tìm thấy danh sách truyện");
    return Response.success(data, nextPageToken(doc));
}
