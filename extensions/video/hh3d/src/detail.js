// detail.js — thong tin chi tiet mot phim tren HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url).replace(/\/+$/, "") + "/";
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var name = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var ogTitle = safeFirst(doc.select("meta[property=og:title]"));
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name.replace(/\s*-\s*HH3D.*$/i, "").replace(/\s*\|\s*HH3D.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var ogImg = safeFirst(doc.select("meta[property=og:image]"));
    if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    if (!cover) {
        var poster = safeFirst(doc.select(".movie-poster img, img.wp-post-image"));
        if (poster !== null) cover = unwrapCover(poster.attr("data-src") || poster.attr("src"));
    }

    var desc = "";
    var ogDesc = safeFirst(doc.select("meta[property=og:description], meta[name=description]"));
    if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));

    var genres = [];
    var seen = {};
    var gLinks = doc.select("a[href*='/the-loai/']");
    var i = 0;
    for (i = 0; i < gLinks.size(); i++) {
        var a = gLinks.get(i);
        var title = cleanText(a.text());
        var href = String(a.attr("href") || "");
        if (!title || !href) continue;
        var path = absUrl(href).replace(/^https?:\/\/[^\/]+/i, "");
        if (seen[path]) continue;
        seen[path] = true;
        genres.push({ title: title, input: path, script: "search.js" });
    }

    var bodyText = cleanText(doc.text());
    var ongoing = bodyText.indexOf("Hoàn Thành") === -1 && bodyText.indexOf("Full") === -1;

    return Response.success({
        name: name,
        author: "HH3D",
        cover: cover,
        description: desc,
        detail: "",
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: genres
    });
}
