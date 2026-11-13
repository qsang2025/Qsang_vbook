// detail.js — Chi tiet truyen: /truyen/<slug>/.
// Ten: h1 (khong class). Anh bia: .summary_image img (og:image la logo
// site, KHONG dung). Tac gia: .author-content a (/tac-gia/<slug>/).
// The loai: .genres-content a[href*='/the-loai/']. Trang thai:
// .post-status .summary-content (Completed). Mo ta: .manga-excerpt.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var AUTHOR_SLUG_RE = /\/tac-gia\/([^\/]+)\/?/;
var GENRE_SLUG_RE = /\/the-loai\/([^\/]+)\/?/;

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url += "/";
    var r = fetchTruyenchuPage(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var nameEl = safeFirst(doc.select("h1"));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) return Response.error("Không tìm thấy thông tin truyện.");

    var cover = "";
    var coverEl = safeFirst(doc.select(".summary_image img"));
    if (coverEl) {
        cover = String(coverEl.attr("data-src") || coverEl.attr("src") || "").trim();
        if (cover) cover = normalizeUrl(cover);
    }

    var author = "Đang cập nhật";
    var authorUrl = "";
    var authorEl = safeFirst(doc.select(".author-content a"));
    if (authorEl) {
        var at = cleanText(authorEl.text());
        if (at) author = at;
        var ahref = String(authorEl.attr("href") || "").trim();
        if (ahref) authorUrl = normalizeUrl(ahref);
    }

    var statusText = "Đang cập nhật";
    var statusEl = safeFirst(doc.select(".post-status .summary-content"));
    if (statusEl) {
        var st = cleanText(statusEl.text());
        if (st) statusText = st;
    }
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("completed") === -1 &&
                  lowerStatus.indexOf("hoàn") === -1 &&
                  lowerStatus.indexOf("đã hoàn") === -1;

    var description = "";
    var descEl = safeFirst(doc.select(".manga-excerpt"));
    if (descEl) {
        var descPs = descEl.select("p");
        if (descPs.size() > 0) {
            var parts = [];
            for (var di = 0; di < descPs.size(); di++) {
                var t = cleanText(descPs.get(di).text());
                if (t) parts.push(t);
            }
            description = parts.join("\n");
        }
        if (!description) description = cleanText(descEl.text());
    }
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[property=\"og:description\"]"));
        if (metaDesc) description = cleanText(metaDesc.attr("content"));
    }

    var genres = [];
    var genreEls = doc.select(".genres-content a[href*='/the-loai/']");
    for (var gi = 0; gi < genreEls.size(); gi++) {
        var ga = genreEls.get(gi);
        var gText = cleanText(ga.text());
        if (!gText) continue;
        var gHref = String(ga.attr("href") || "").trim();
        if (!gHref) continue;
        genres.push({ title: gText, input: normalizeUrl(gHref), script: "gen.js" });
    }

    var suggests = [];
    if (authorUrl) {
        suggests.push({ title: "Truyện cùng tác giả", input: authorUrl, script: "gen.js" });
    }
    if (genres.length > 0) {
        suggests.push({ title: "Truyện cùng thể loại", input: genres[0].input, script: "gen.js" });
    }

    var detailParts = [];
    detailParts.push("<p><strong>Tác giả:</strong> " + author + "</p>");
    detailParts.push("<p><strong>Trạng thái:</strong> " + (ongoing ? "Đang cập nhật" : "Hoàn thành") + "</p>");
    if (genres.length > 0) {
        var genreTitles = [];
        for (var k = 0; k < genres.length; k++) genreTitles.push(genres[k].title);
        detailParts.push("<p><strong>Thể loại:</strong> " + genreTitles.join(", ") + "</p>");
    }
    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        genres: genres,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL,
        suggests: suggests
    });
}
