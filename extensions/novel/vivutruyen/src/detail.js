// detail.js — Chi tiet truyen: /<slug>/.
// Ten: h1 a.title-truyen. Anh bia: .image-truyen img (data-src, lazy).
// Tac gia / The loai / Trang thai: ul.info-truyen li (tac gia co the
// la text tran khong link). Mo ta: .noi-dung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url += "/";
    var r = fetchVivuPage(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var nameEl = safeFirst(doc.select("h1 a.title-truyen"));
    if (!nameEl) nameEl = safeFirst(doc.select("h1"));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) return Response.error("Không tìm thấy thông tin truyện.");

    var cover = "";
    var coverEl = safeFirst(doc.select(".image-truyen img"));
    if (coverEl) {
        cover = String(coverEl.attr("data-src") || coverEl.attr("src") || "").trim();
        if (cover) cover = normalizeUrl(cover);
    }

    var author = "Đang cập nhật";
    var authorUrl = "";
    var statusText = "Đang cập nhật";
    var genres = [];
    var genreTexts = [];
    var infoItems = doc.select("ul.info-truyen li");
    for (var i = 0; i < infoItems.size(); i++) {
        var item = infoItems.get(i);
        var text = cleanText(item.text());
        var lowerText = text.toLowerCase();
        if (lowerText.indexOf("tác giả:") !== -1) {
            var authorA = safeFirst(item.select("a"));
            if (authorA) {
                var at = cleanText(authorA.text());
                if (at) author = at;
                var ahref = String(authorA.attr("href") || "").trim();
                if (ahref) authorUrl = normalizeUrl(ahref);
            } else {
                var plain = text.replace(/tác giả:/i, "").trim();
                if (plain) author = plain;
            }
        } else if (lowerText.indexOf("thể loại:") !== -1) {
            var cats = item.select("a");
            for (var j = 0; j < cats.size(); j++) {
                var catA = cats.get(j);
                var catName = cleanText(catA.text());
                var catHref = String(catA.attr("href") || "").trim();
                if (!catName || !catHref) continue;
                genres.push({ title: catName, input: normalizeUrl(catHref), script: "gen.js" });
                genreTexts.push(catName);
            }
        } else if (lowerText.indexOf("trạng thái:") !== -1) {
            var st = text.replace(/trạng thái:/i, "").trim();
            if (st) statusText = st;
        }
    }

    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("hoàn thành") === -1 &&
                  lowerStatus.indexOf("đã hoàn") === -1 &&
                  lowerStatus.indexOf("full") === -1 &&
                  lowerStatus.indexOf("complete") === -1;

    var description = "";
    var descEl = safeFirst(doc.select(".noi-dung"));
    if (descEl) description = cleanText(descEl.text()).substring(0, 500);

    var suggests = [];
    if (authorUrl) {
        suggests.push({ title: "Truyện cùng tác giả", input: authorUrl, script: "gen.js" });
    }
    if (genres.length > 0) {
        suggests.push({ title: "Truyện cùng thể loại", input: genres[0].input, script: "gen.js" });
    }

    var detailParts = [];
    detailParts.push("<p><strong>Tác giả:</strong> " + author + "</p>");
    detailParts.push("<p><strong>Trạng thái:</strong> " + statusText + "</p>");
    if (genreTexts.length > 0) {
        detailParts.push("<p><strong>Thể loại:</strong> " + genreTexts.join(", ") + "</p>");
    }
    var detail = detailParts.join("");

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        host: BASE_URL
    });
}
