// detail.js — Chi tiet truyen Xa Lo Sach (xalosach.com).
// Input: URL trang chi tiet /<slug>-0.html.
// Ten o h1; tac gia .ten_tacgia; bia .wrap-content-image img; trang
// thai + the loai rieng cua truyen + luot xem trong .list-info; mo ta
// trong JSON-LD (script application/ld+json).

load("config.js");
load("rate-limit.js");

function execute(url) {
    var t = xlsFetchText(url, BASE_URL + "/");
    if (t.error) return Response.error(t.error);
    var doc = Html.parse(t.text);

    var nameEl = selFirst(doc, "h1");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = "";
    var authorEl = selFirst(doc, ".ten_tacgia");
    if (authorEl) author = cleanText(authorEl.text());
    if (!author) {
        var ldAuthor = t.text.match(/"author":\[\{"@type":"Person","name":"([^"]+)"/);
        if (ldAuthor) author = ldAuthor[1];
    }
    if (!author) author = "Đang cập nhật";

    var cover = "";
    var coverEl = selFirst(doc, ".wrap-content-image img");
    if (coverEl) cover = absUrl(coverEl.attr("src") || coverEl.attr("data-src") || "");

    var genres = [];
    var infoEl = selFirst(doc, ".list-info");
    var infoText = infoEl ? infoEl.text() : "";
    if (infoEl) {
        var gEls = infoEl.select("a[href*=\"/the-loai/\"]");
        for (var i = 0; i < gEls.size(); i++) {
            var g = gEls.get(i);
            var gt = cleanText(g.text());
            var gh = g.attr("href");
            if (gt && gh) genres.push({ title: gt, input: absUrl(gh), script: "gen.js" });
        }
    }

    var statusText = infoText;
    var ongoing = statusText.indexOf("Đang tiến hành") !== -1;
    var views = "";
    var viewEl = selFirst(doc, ".list-info view");
    if (viewEl) views = cleanText(viewEl.text());

    var description = "";
    var ldDesc = t.text.match(/"description":"((?:[^"\\]|\\.)*)"/);
    if (ldDesc) {
        try { description = JSON.parse("\"" + ldDesc[1] + "\""); } catch (e) { description = ldDesc[1]; }
    }
    if (!description) {
        var descEl = selFirst(doc, ".mota");
        if (descEl) description = descEl.html();
    }
    if (!description) {
        var descEl2 = selFirst(doc, "#gioithieutruyen");
        if (descEl2) description = descEl2.html();
    }

    var genreTitles = [];
    for (var j = 0; j < genres.length; j++) genreTitles.push(genres[j].title);
    var detail = "Tác giả: " + author;
    if (views) detail += "<br>Lượt xem: " + views;
    if (genreTitles.length > 0) detail += "<br>Thể loại: " + genreTitles.join(", ");
    detail += "<br>Tình trạng: " + (ongoing ? "Đang tiến hành" : "Hoàn thành");

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
