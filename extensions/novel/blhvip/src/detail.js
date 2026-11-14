// detail.js — Thong tin truyen: ten (bo .prefix nhu [Dich]/[Free]),
// tac gia, bia, mo ta, thong tin chuong/doc, trang thai, the loai.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var rr = blhFetchDoc(normalizeUrl(url));
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var info = selFirst(doc, ".info-story");
    if (!info) return Response.error("Không tìm thấy truyện");
    var titleEl = selFirst(info, "h1");
    if (!titleEl) return Response.error("Không tìm thấy truyện");
    var prefixEl = selFirst(titleEl, ".prefix");
    if (prefixEl) prefixEl.remove();
    var name = cleanText(titleEl.text());
    if (!name) return Response.error("Không tìm thấy truyện");

    var authorEl = selFirst(info, "a[href^=tac-gia]");
    var coverEl = selFirst(doc, ".image-story img");
    var descEl = selFirst(doc, "#tab-info-1 .s-content");
    var storyInfoEl = selFirst(info, ".story-info");

    var details = [];
    var ps = info.select("p.text-info");
    for (var i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (t) details.push(t);
    }
    if (storyInfoEl) details.push(cleanText(storyInfoEl.text()));

    var genres = [];
    var suggests = [];
    var gLinks = info.select("a[href^=the-loai]");
    for (var j = 0; j < gLinks.size(); j++) {
        var g = gLinks.get(j);
        var gt = cleanText(g.text());
        var gh = g.attr("href") || "";
        if (!gt || !gh) continue;
        genres.push({ title: gt, input: normalizeUrl(gh), script: "source.js" });
        suggests.push({ title: "Cùng thể loại: " + gt, input: normalizeUrl(gh), script: "source.js" });
    }

    return Response.success({
        name: name,
        author: authorEl ? cleanText(authorEl.text()) : "",
        cover: coverEl ? normalizeUrl(coverEl.attr("src") || "") : "",
        description: descEl ? descEl.html() : "",
        detail: details.join("<br>"),
        url: normalizeUrl(url),
        type: "novel",
        format: "novel",
        ongoing: info.text().indexOf("Đã hoàn thành") === -1,
        genres: genres,
        suggests: suggests
    });
}
