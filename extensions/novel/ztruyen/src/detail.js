// detail.js — Chi tiet truyen: /<slug>/.
// Ten: h1. Anh bia: og:image. Tac gia / trang thai / the loai / luot xem:
// hang meta ul.meta-list li.meta-row (label + value). Mo ta: #story-desc.
// So chuong moi nhat: nut .btn-latest (dang -chuong-N) — dung cho
// page.js tinh so trang muc luc.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function metaRowValue(doc, label) {
    var rows = doc.select("ul.meta-list li.meta-row");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var lab = safeFirst(row.select(".meta-label"));
        if (!lab) continue;
        if (cleanText(lab.text()) !== label) continue;
        return safeFirst(row.select(".meta-value"));
    }
    return null;
}

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url += "/";
    var r = fetchZtruyenPage(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var nameEl = safeFirst(doc.select("h1"));
    if (nameEl) {
        var linkEl = safeFirst(nameEl.select("a"));
        name = cleanText(linkEl ? linkEl.text() : nameEl.text());
    }
    if (!name) return Response.error("Không tìm thấy thông tin truyện.");

    var cover = "";
    var ogImg = safeFirst(doc.select("meta[property=\"og:image\"]"));
    if (ogImg) cover = normalizeUrl(ogImg.attr("content"));
    if (!cover) {
        var coverEl = safeFirst(doc.select("img[src*=\"wp-content/uploads\"]"));
        if (coverEl) cover = normalizeUrl(coverEl.attr("src"));
    }

    var author = "Đang cập nhật";
    var authorUrl = "";
    var authorCell = metaRowValue(doc, "Tác giả");
    if (authorCell) {
        var authorA = safeFirst(authorCell.select("a"));
        if (authorA) {
            author = cleanText(authorA.text()) || "Đang cập nhật";
            authorUrl = normalizeUrl(authorA.attr("href"));
        } else {
            var t = cleanText(authorCell.text());
            if (t) author = t;
        }
    }

    var statusText = "Đang cập nhật";
    var statusCell = metaRowValue(doc, "Trạng thái");
    if (statusCell) {
        var st = cleanText(statusCell.text());
        if (st) statusText = st;
    }
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("hoàn thành") === -1 &&
                  lowerStatus.indexOf("đã hoàn") === -1 &&
                  lowerStatus.indexOf("complete") === -1;

    var description = "";
    var descEl = safeFirst(doc.select("#story-desc"));
    if (descEl) description = cleanText(descEl.text());
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[property=\"og:description\"]"));
        if (metaDesc) description = cleanText(metaDesc.attr("content"));
    }

    var genres = [];
    var genreCell = metaRowValue(doc, "Thể loại");
    if (genreCell) {
        var chips = genreCell.select("a");
        for (var i = 0; i < chips.size(); i++) {
            var c = chips.get(i);
            var gt = cleanText(c.text());
            var gh = String(c.attr("href") || "").trim();
            if (!gt || !gh) continue;
            genres.push({ title: gt, input: normalizeUrl(gh), script: "gen.js" });
        }
    }

    var views = "";
    var viewsCell = metaRowValue(doc, "Lượt xem");
    if (viewsCell) views = cleanText(viewsCell.text());

    var latestNum = extractLatestChapterNum(doc);

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
    if (views) detailParts.push("<p><strong>Lượt xem:</strong> " + views + "</p>");
    if (latestNum > 0) detailParts.push("<p><strong>Chương mới nhất:</strong> " + latestNum + "</p>");
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
