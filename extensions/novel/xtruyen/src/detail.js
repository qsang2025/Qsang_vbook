// detail.js — thong tin chi tiet mot truyen tren XTruyen.
// Tieu de h1, bia .summary_image img, tac gia .author-content a,
// mo ta .summary__content, trang thai .post-status .summary-content,
// the loai .genres-content a (tro ve book.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('challenge-handler.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("xtruyen.vn");
    var doc = fetchDoc(url);
    if (!doc) return Response.error(formatChallengeError("XTruyện", url));

    var title = doc.select("h1").first();
    var cover = doc.select(".summary_image img, .tab-summary img, .post-thumb img").first();
    var author = doc.select(".author-content a").first();
    var intro = doc.select(".summary__content, .manga-excerpt, .description-summary").first();
    // Bo nut "Xem them" trong khoi mo ta.
    if (intro) intro.select(".c-content-readmore").remove();
    var status = doc.select(".post-status .summary-content").first();

    var coverUrl = "";
    if (cover) {
        coverUrl = cover.attr("data-src") || cover.attr("src") || "";
        if (coverUrl.indexOf("data:") === 0) coverUrl = cover.attr("src") || "";
        if (coverUrl.indexOf("data:") === 0) coverUrl = "";
        // Bia that co the nam tren CDN khac host (thumb.xtruyen.vn) nen
        // KHONG dung absUrl (no viet lai host ve BASE_URL).
        if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
            coverUrl = coverUrl.charAt(0) === "/" ? siteOrigin() + coverUrl : BASE_URL + "/" + coverUrl;
        }
    }

    var genres = [];
    var seen = {};
    doc.select(".genres-content a").forEach(function (e) {
        var name = cleanText(e.text());
        var href = e.attr("href");
        if (!name || !href || seen[href]) return;
        seen[href] = true;
        genres.push({
            title: name,
            input: absUrl(href),
            script: "book.js"
        });
    });

    var statusText = status ? cleanText(status.text()) : "";
    var authorText = author ? cleanText(author.text()) : "";
    var infoHtml = "";
    if (statusText) infoHtml += "<p>Trạng thái: " + statusText + "</p>";
    if (authorText) infoHtml += "<p>Tác giả: " + authorText + "</p>";

    var low = statusText.toLowerCase();
    return Response.success({
        name: title ? cleanText(title.text()) : "",
        author: authorText,
        cover: coverUrl,
        description: intro ? intro.html() : "",
        detail: infoHtml,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: low.indexOf("hoàn") < 0 && low.indexOf("full") < 0 && low.indexOf("end") < 0,
        genres: genres
    });
}
