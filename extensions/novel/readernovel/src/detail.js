// detail.js — Thong tin chi tiet mot truyen.
//
// Ten h1.page-title; tac gia a[href^=/author/] dau tien; bia meta
// og:image (/imgs/medium/...); the loai link /browse?...genre[]=N;
// trang thai "Status : Ongoing/Completed" trong li.list-group-item;
// mo ta #collapseSummary. Khong login, khong khoa VIP (kiem chung
// tu VM 2026-11-15).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var name = cleanText(doc.select("h1.page-title").text());
    if (!name) name = cleanText(doc.select("h1").text());
    if (!name) return Response.error("Không đọc được trang truyện: " + url);

    var author = "";
    var authorLinks = doc.select("a[href^=/author/]");
    if (authorLinks.size() > 0) author = cleanText(authorLinks.get(0).text());

    var cover = doc.select("meta[property=og:image]").attr("content") || "";
    if (cover) cover = absUrl(cover);

    var genres = [];
    var glinks = doc.select("a[href*='genre[]=']");
    for (var i = 0; i < glinks.size(); i++) {
        var a = glinks.get(i);
        var href = a.attr("href");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        genres.push({ title: title, input: href, script: "gen.js" });
    }

    var status = "";
    var items = doc.select("li.list-group-item");
    for (var j = 0; j < items.size(); j++) {
        var t = cleanText(items.get(j).text());
        if (t.indexOf("Status") === 0) {
            status = t.replace(/^Status\s*:\s*/, "");
            break;
        }
    }
    var ongoing = status !== "Completed";

    var descEl = selFirst(doc, "#collapseSummary");
    var description = descEl ? descEl.html() : "";

    var detail = "";
    if (author) detail += "Tác giả: " + author + "<br>";
    detail += status ? ("Trạng thái: " + status + "<br>") : (ongoing ? "Trạng thái: Ongoing<br>" : "Trạng thái: Completed<br>");
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
