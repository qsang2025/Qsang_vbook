// detail.js — Thong tin chi tiet mot truyen.
//
// Ten h1.tit trong .m-desc; tac gia a[href^=/author/] dau tien; bia
// meta og:image; the loai .txt .item a[href^=/genre/]; trang thai link
// title Ongoing/Completed trong .txt .item; mo ta #novel-summary-inner;
// so chuong + diem o #list-chapter (data-total-chapters) va #novel-score
// (data-avg). Khong login, khong khoa VIP (kiem chung tu VM 2026-11-15).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var name = cleanText(doc.select(".m-desc h1.tit").text());
    if (!name) name = cleanText(doc.select("h1").text());
    if (!name) return Response.error("Không đọc được trang truyện: " + url);

    var author = "";
    var authorLinks = doc.select("a[href^=/author/]");
    if (authorLinks.size() > 0) author = cleanText(authorLinks.get(0).text());

    var cover = doc.select("meta[property=og:image]").attr("content") || "";
    if (cover) cover = absUrl(cover);

    var genres = [];
    var glinks = doc.select("div.txt div.item a[href^=/genre/]");
    for (var i = 0; i < glinks.size(); i++) {
        var a = glinks.get(i);
        var href = a.attr("href");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        genres.push({ title: title, input: href, script: "gen.js" });
    }

    var status = "";
    var statusLinks = doc.select("div.txt div.item a[title]");
    for (var j = 0; j < statusLinks.size(); j++) {
        var t = statusLinks.get(j).attr("title");
        if (t === "Ongoing" || t === "Completed") { status = t; break; }
    }
    var ongoing = status !== "Completed";

    var chapCount = "";
    var listBox = selFirst(doc, "#list-chapter");
    if (listBox) chapCount = listBox.attr("data-total-chapters") || "";
    var rating = "";
    var scoreBox = selFirst(doc, "#novel-score");
    if (scoreBox) rating = scoreBox.attr("data-avg") || "";

    var descEl = selFirst(doc, "#novel-summary-inner");
    var description = descEl ? descEl.html() : "";

    var detail = "";
    if (author) detail += "Tác giả: " + author + "<br>";
    if (chapCount) detail += "Số chương: " + chapCount + "<br>";
    if (rating) detail += "Đánh giá: " + rating + "/5<br>";
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
