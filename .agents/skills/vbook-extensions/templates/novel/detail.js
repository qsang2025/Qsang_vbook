// detail.js — thong tin chi tiet mot truyen (template novel).
// Y tuong: Darkrai9x detail.js (name/author/cover/description/detail/url/
// type/format/ongoing/genres/suggests/reviews/comments) + ustaezav
// (normalizeUrl dau tien, genres tro ve script danh sach book.js).
// Tat ca SELECTOR_ doi theo giao dien site that.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var statusText = cleanText(doc.select("SELECTOR_STATUS").text());
    var coverEl = doc.select("SELECTOR_COVER img").first();
    var descEl = doc.select("SELECTOR_DESC").first();

    var genres = [];
    doc.select("SELECTOR_GENRE_LINKS a").forEach(function (el) {
        var href = el.attr("href");
        var title = cleanText(el.text());
        if (!href || !title) return;
        genres.push({ title: title, input: absUrl(href), script: "book.js" });
    });

    return Response.success({
        name: cleanText(doc.select("SELECTOR_TITLE").text()),
        author: cleanText(doc.select("SELECTOR_AUTHOR").text()),
        cover: coverEl === null ? "" : coverEl.attr("src"),
        description: descEl === null ? "" : descEl.html(),
        detail: doc.select("SELECTOR_INFO").html(),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: statusText.indexOf("Hoàn") === -1,
        genres: genres
    });
}
