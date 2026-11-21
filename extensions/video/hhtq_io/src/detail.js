// detail.js — thong tin chi tiet mot phim tren HHTQ IO (hhtq.io).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = toDetailUrl(normalizeUrl(url));
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
    name = name.replace(/\s*-\s*HHTQ.*$/i, "").replace(/\s*\|\s*HHTQ.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var ogImg = safeFirst(doc.select("meta[property=og:image]"));
    if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    if (!cover) {
        var poster = safeFirst(doc.select(".poster-wrap img, img"));
        if (poster !== null) cover = unwrapCover(poster.attr("data-src") || poster.attr("src"));
    }

    var desc = "";
    var ogDesc = safeFirst(doc.select("meta[name=description], meta[property=og:description]"));
    if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));

    var bodyText = cleanText(doc.text());
    var ongoing = bodyText.indexOf("Hoàn thành") === -1 && bodyText.indexOf("Hoàn Thành") === -1;

    return Response.success({
        name: name,
        author: "HHTQ IO",
        cover: cover,
        description: desc,
        detail: "",
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: []
    });
}
