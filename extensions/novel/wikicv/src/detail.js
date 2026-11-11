// detail.js — Thông tin chi tiết một truyện
// Contract: execute(url) → { name*, cover, host, author, description, ongoing:bool*,
//                             genres?:[{title,input,script}] }
// Chỉ trả tên + mô tả + thể loại; KHÔNG trả suggests (tránh mớ truyện không liên quan)
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    rateLimitDelay("wikicv.org");
    var res = wikiFetch(url);
    if (!res.ok) return Response.error("Không tải được trang (HTTP " + res.status + ")");

    var doc = res.html();

    // Tên truyện
    var nameEl = doc.select(".cover-info h2").first();
    var name = (nameEl ? nameEl.text().trim() : "") + "";

    // Ảnh bìa
    var coverEl = doc.select(".book-info .cover-wrapper img").first();
    var cover = "";
    if (coverEl) {
        cover = (coverEl.attr("data-src") || coverEl.attr("src") || "") + "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
    }

    // Tác giả: dòng p chứa "Tác giả:"
    var author = "";
    doc.select(".cover-info p").forEach(function (p) {
        var t = p.text() + "";
        if (t.indexOf("Tác giả") > -1) {
            var a = p.select("a").first();
            if (a) author = (a.text().trim()) + "";
        }
    });

    // Trạng thái: dòng p chứa "Tình trạng:"
    var status = "";
    doc.select(".cover-info p").forEach(function (p) {
        var t = p.text() + "";
        if (t.indexOf("Tình trạng") > -1) {
            var a = p.select("a").first();
            status = (a ? a.text().trim() : t.replace("Tình trạng:", "").trim()) + "";
        }
    });
    var ongoing = status.indexOf("Hoàn") === -1
        && status.indexOf("Completed") === -1
        && status.indexOf("Full") === -1
        && status.indexOf("完结") === -1;

    // Mô tả
    var descEl = doc.select(".book-desc-detail").first();
    var description = (descEl ? descEl.html() : "") + "";

    // Thể loại: dòng p đầu của .book-desc chứa các link
    var genres = [];
    var firstP = doc.select(".book-desc > p").first();
    if (firstP) {
        firstP.select("a").forEach(function (el) {
            var gTitle = (el.text().trim()) + "";
            var gHref = (el.attr("href") || "") + "";
            if (!gTitle || !gHref) return;
            if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
            genres.push({ title: gTitle, input: gHref, script: "book.js" });
        });
    }

    var result = {
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        ongoing: ongoing
    };
    if (genres.length > 0) result.genres = genres;
    return Response.success(result);
}