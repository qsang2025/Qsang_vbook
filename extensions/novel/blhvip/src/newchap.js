// newchap.js — Chuong moi cap nhat (/chuong-moi-cap-nhat): moi dong la
// mot truyen, ten truyen trong p.line-clamp-1 (bo .prefix nhu [Free],
// [Dich]), link chuong moi nhat trong a[href*=/chuong-].
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
    var rows = doc.select(".list-story__item li");
    for (var i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var titleEl = selFirst(e, "p.line-clamp-1");
        if (!titleEl) continue;
        var prefixEl = selFirst(titleEl, ".prefix");
        var tag = prefixEl ? cleanText(prefixEl.text()).replace(/[\[\]]/g, "") : "";
        if (prefixEl) prefixEl.remove();
        var name = cleanText(titleEl.text());
        var chapEl = selFirst(e, "a[href*=/chuong-]");
        if (!chapEl) continue;
        var slug = storySlug(chapEl.attr("href") || "");
        if (!name || !slug) continue;
        var authorEl = selFirst(e, "a.author");
        items.push({
            name: name,
            link: BASE_URL + "/truyen/" + slug,
            description: (authorEl ? cleanText(authorEl.text()) : "") + " - " + cleanText(chapEl.text()),
            tag: tag,
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy chương mới cập nhật");
    return Response.success(items, nextPageToken(doc));
}
