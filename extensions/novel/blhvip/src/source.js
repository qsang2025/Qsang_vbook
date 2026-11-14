// source.js — Danh sach truyen cua mot trang danh sach (tab trang chu,
// the loai, trang tac gia...): khoi .basis-full dau tien chua cac
// .novel-item (12/trang), phan trang ?page=N qua a.next-page.
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var p = parseInt(page, 10);
    var full = normalizeUrl(url);
    if (!isNaN(p) && p > 1) {
        full = full + (full.indexOf("?") === -1 ? "?page=" + p : "&page=" + p);
    }
    var rr = blhFetchDoc(full);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var items = [];
    var wrap = selFirst(doc, ".basis-full");
    var cards = wrap ? wrap.select(".novel-item") : doc.select(".novel-item");
    for (var i = 0; i < cards.size(); i++) {
        var e = cards.get(i);
        var linkEl = selFirst(e, "h3 a");
        if (!linkEl) continue;
        var name = cleanText(linkEl.text());
        var href = linkEl.attr("href") || "";
        if (!name || !href) continue;
        var imgEl = selFirst(e, "img");
        var authorEl = selFirst(e, "a.author");
        var infoEl = selFirst(e, ".story-info");
        var tagEl = selFirst(e, ".story-status");
        var catEl = selFirst(e, "a[href^=danh-muc]");
        var tag = tagEl ? cleanText(tagEl.text()) : (catEl ? cleanText(catEl.text()) : "");
        items.push({
            name: name,
            link: normalizeUrl(href),
            cover: imgEl ? normalizeUrl(imgEl.attr("src") || "") : "",
            description: (authorEl ? cleanText(authorEl.text()) : "") + " - " + (infoEl ? cleanText(infoEl.text()) : ""),
            tag: tag,
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện trong trang này");
    return Response.success(items, nextPageToken(doc));
}
