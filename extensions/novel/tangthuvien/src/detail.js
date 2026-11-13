// detail.js — Chi tiet truyen: /<slug>.
// Ten: h1. Anh bia: img Next Image (giai ma url= trong src/srcSet).
// Tac gia / trang thai / the loai: hang thong tin
// div[class*=grid-cols-] (Status, Tac Gia, Danh Muc). Mo ta:
// div[class*=leading-relaxed]. Tong so chuong: "N Chuong" trong header.
// The loai chip lay tu mang categories trong RSC (co slugId) — neu
// khong trich duoc thi dung text Danh Muc (khong link).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function infoRowValue(doc, label) {
    var rows = doc.select("div[class*=grid-cols-]");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var cells = row.select("> div");
        if (cells.size() < 2) continue;
        var key = cleanText(cells.get(0).text());
        if (key === label) return cells.get(1);
    }
    return null;
}

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTtvPage(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var rawHtml = r.rawHtml;

    var name = "";
    var nameEl = safeFirst(doc.select("h1"));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) return Response.error("Không tìm thấy thông tin truyện.");

    var cover = "";
    var coverEl = safeFirst(doc.select("img[src*=\"/_next/image\"]"));
    if (!coverEl) coverEl = safeFirst(doc.select("img[alt]"));
    if (coverEl) cover = coverFromImg(coverEl);

    var author = "Đang cập nhật";
    var authorUrl = "";
    var authorCell = infoRowValue(doc, "Tác Giả");
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
    var statusCell = infoRowValue(doc, "Status");
    if (statusCell) {
        var st = cleanText(statusCell.text());
        if (st) statusText = st;
    }
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("hoàn thành") === -1 &&
                  lowerStatus.indexOf("đã hoàn") === -1 &&
                  lowerStatus.indexOf("complete") === -1;

    var description = "";
    var descEl = safeFirst(doc.select("div[class*=leading-relaxed]"));
    if (descEl) description = cleanText(descEl.text());
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[property=\"og:description\"]"));
        if (metaDesc) description = cleanText(metaDesc.attr("content"));
    }

    var total = extractTotalChapters(doc);

    var genres = [];
    var cats = extractBookCategories(rawHtml);
    for (var i = 0; i < cats.length; i++) {
        genres.push({
            title: cats[i].title,
            input: BASE_URL + "/truyen?genre=" + cats[i].slug,
            script: "gen.js"
        });
    }
    // Neu khong trich duoc slug tu RSC thi bo chip the loai (chi giu
    // text trong phan detail) — tranh mo danh sach rong.

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
    if (total > 0) detailParts.push("<p><strong>Số chương:</strong> " + total + "</p>");
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
