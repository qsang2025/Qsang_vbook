// nominationList.js — Danh sach BTV de cu (12 muc/trang).
// URL mac dinh tu home.js la /btv-de-cu?period=all (trang thang nay rong).
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var fetchUrl = appendPage(normalizeUrl(url), page);
    var rr = ttlFetchDoc(fetchUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var cards = doc.select("#editor-picks-list .editor-picks-grid .editor-pick-card");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleEl = selFirst(card, ".editor-pick-title-row h3 a");
        var name = titleEl ? cleanText(titleEl.text()) : "";
        var href = titleEl ? titleEl.attr("href") : "";
        if (!href) {
            var coverA = selFirst(card, "a.editor-pick-cover");
            if (coverA) href = coverA.attr("href");
        }
        if (!href || !name) continue;
        var imgEl = selFirst(card, ".editor-pick-cover img");
        var cover = imgEl ? (imgEl.attr("src") || "") : "";
        var reasonEl = selFirst(card, ".editor-pick-reason");
        data.push({
            name: name,
            link: normalizeUrl(href),
            cover: normalizeUrl(cover),
            description: reasonEl ? cleanText(reasonEl.text()) : "",
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Chưa có tác phẩm BTV đề cử trong mốc này");
    return Response.success(data, nextPageToken(doc));
}
