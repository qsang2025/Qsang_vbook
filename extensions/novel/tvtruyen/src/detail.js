// detail.js — Chi tiet truyen: /<slug>.html.
// LUU Y: JSON-LD tren trang KHONG parse duoc (description chua xuong dong
// tho — JSON.parse loi) nen doc DOM truc tiep, khong dua vao JSON-LD.
// Ten: h3.title[itemprop="name"]; anh bia: img[itemprop="image"]
// (cdn-2.cscldsck.com); tac gia: .info .author a; the loai:
// .info .genres .item-value -> /the-loai/<slug>.html; trang thai:
// .text-success.item-value ("Dang ra" / "Full"); mo ta: section.limit-desc.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var nameEl = safeFirst(doc.select("h3.title[itemprop=\"name\"]"));
    if (!nameEl) nameEl = safeFirst(doc.select("h3#comic_name"));
    if (!nameEl) nameEl = safeFirst(doc.select("h3.title"));
    if (!nameEl) nameEl = safeFirst(doc.select("h1"));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) return Response.error("Không tìm thấy thông tin truyện.");

    var cover = "";
    var coverEl = safeFirst(doc.select("img[itemprop=\"image\"]"));
    if (!coverEl) coverEl = safeFirst(doc.select(".books .book img"));
    if (!coverEl) coverEl = safeFirst(doc.select(".book img"));
    if (coverEl) cover = normalizeUrl(coverEl.attr("src") || coverEl.attr("data-src") || "");

    var author = "Đang cập nhật";
    var authorUrl = "";
    var authorEl = safeFirst(doc.select(".info .author a"));
    if (!authorEl) authorEl = safeFirst(doc.select("[itemprop=\"author\"]"));
    if (!authorEl) authorEl = safeFirst(doc.select("a[href*=\"/tac-gia/\"]"));
    if (authorEl) {
        author = cleanText(authorEl.text()) || "Đang cập nhật";
        authorUrl = normalizeUrl(authorEl.attr("href"));
    }

    var description = "";
    var descEl = safeFirst(doc.select("section.limit-desc"));
    if (!descEl) descEl = safeFirst(doc.select(".limit-desc"));
    if (!descEl) descEl = safeFirst(doc.select(".desc-text"));
    if (!descEl) descEl = safeFirst(doc.select("[itemprop=\"description\"]"));
    if (!descEl) descEl = safeFirst(doc.select(".desc-text-full"));
    if (!descEl) descEl = safeFirst(doc.select(".desc-content"));
    if (descEl) description = cleanText(descEl.text());

    var genres = [];
    var genreEls = doc.select(".info .genres .item-value");
    if (genreEls.size() === 0) genreEls = doc.select("[itemprop=\"genre\"]");
    if (genreEls.size() === 0) genreEls = doc.select(".genres a");
    var firstGenreUrl = "";
    for (var i = 0; i < genreEls.size(); i++) {
        var g = genreEls.get(i);
        var gText = cleanText(g.text());
        var gHref = normalizeUrl(g.attr("href"));
        if (gText && gHref) {
            genres.push({ title: gText, input: gHref, script: "gen.js" });
            if (!firstGenreUrl) firstGenreUrl = gHref;
        }
    }

    var statusText = "Đang ra";
    var statusEl = safeFirst(doc.select(".info .text-success.item-value, .info .text-info.item-value"));
    if (!statusEl) {
        var infoBlocks = doc.select(".info div, .info p, .info li");
        for (var j = 0; j < infoBlocks.size(); j++) {
            var block = infoBlocks.get(j);
            var text = block.text();
            if (text.indexOf("Trạng thái:") >= 0) {
                statusText = text.replace("Trạng thái:", "").trim();
                break;
            }
        }
    } else {
        statusText = cleanText(statusEl.text());
    }
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("hoàn thành") === -1 &&
                  lowerStatus.indexOf("đã hoàn") === -1 &&
                  lowerStatus.indexOf("full") === -1 &&
                  lowerStatus.indexOf("complete") === -1;

    var suggests = [];
    if (authorUrl) {
        suggests.push({ title: "Truyện cùng tác giả", input: authorUrl, script: "gen.js" });
    }
    if (firstGenreUrl) {
        suggests.push({ title: "Truyện cùng thể loại", input: firstGenreUrl, script: "gen.js" });
    }

    var detailParts = [];
    detailParts.push("<p><strong>Tác giả:</strong> " + author + "</p>");
    detailParts.push("<p><strong>Trạng thái:</strong> " + (ongoing ? "Đang ra" : "Hoàn thành") + "</p>");
    if (genres.length > 0) {
        var genreTitles = [];
        for (var k = 0; k < genres.length; k++) genreTitles.push(genres[k].title);
        detailParts.push("<p><strong>Thể loại:</strong> " + genreTitles.join(", ") + "</p>");
    }
    var detail = detailParts.join("<br>");

    var commentConfig = { title: "Bình luận", input: url, script: "comment.js" };

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        genres: genres,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL,
        suggests: suggests,
        comment: commentConfig,
        comments: commentConfig
    });
}
