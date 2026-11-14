// detail.js — Thong tin chi tiet mot truyen: article#novel.
//
// Ten h1.novel-title, ten goc h2.alternative-title, tac gia .author
// span[itemprop=author], bia figure.cover img (data-src), trang thai +
// so chuong o .header-stats, the loai .categories a.property-item,
// mo ta #info .summary .content.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var name = cleanText(doc.select("h1.novel-title").text());
    if (!name) return Response.error("Không đọc được trang truyện: " + url);
    var altTitle = cleanText(doc.select("h2.alternative-title").text());
    var author = cleanText(doc.select(".author span[itemprop=author]").text());
    var cover = "";
    var img = selFirst(doc, "figure.cover img");
    if (img) {
        cover = img.attr("data-src") || img.attr("src") || "";
        if (cover.indexOf("placeholder-158") !== -1) cover = "";
        if (cover) cover = absUrl(cover);
    }
    var statsText = cleanText(doc.select(".header-stats").text());
    var ongoing = statsText.indexOf("Completed") === -1;
    var chapCount = "";
    var cm = statsText.match(/([0-9,]+)\s*Chapters/);
    if (cm) chapCount = cm[1];

    var genres = [];
    var glinks = doc.select(".categories a.property-item");
    for (var i = 0; i < glinks.size(); i++) {
        var a = glinks.get(i);
        var href = a.attr("href");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        genres.push({ title: title, input: href, script: "gen.js" });
    }
    var descEl = selFirst(doc, "#info .summary .content");
    var description = descEl ? descEl.html() : "";

    var detail = "";
    if (altTitle) detail += "Tên gốc: " + altTitle + "<br>";
    if (author) detail += "Tác giả: " + author + "<br>";
    if (chapCount) detail += "Số chương: " + chapCount + "<br>";
    detail += ongoing ? "Trạng thái: Ongoing<br>" : "Trạng thái: Completed<br>";
    if (genres.length > 0) {
        var gs = [];
        for (var g = 0; g < genres.length; g++) gs.push(genres[g].title);
        detail += "Thể loại: " + gs.join(", ");
    }

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
        genres: genres
    });
}
