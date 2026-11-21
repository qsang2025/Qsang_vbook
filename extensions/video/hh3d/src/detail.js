// detail.js — thong tin chi tiet mot phim tren hh3d.ad.
// Nap: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url).replace(/\/+$/, "");
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var name = "";
    var h1 = safeFirst(doc.select("h1.movie-title-detail"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var ogTitle = safeFirst(doc.select("meta[property=og:title]"));
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name.replace(/\s*\|\s*HH3D.*$/i, "").replace(/\s*-\s*HH3D.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var ogImg = safeFirst(doc.select("meta[property=og:image]"));
    if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    if (!cover) {
        var poster = safeFirst(doc.select(".movie-poster img"));
        if (poster !== null) {
            cover = unwrapCover(poster.attr("data-src") || poster.attr("src"));
        }
    }

    var desc = "";
    var ogDesc = safeFirst(doc.select("meta[property=og:description], meta[name=description]"));
    if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));

    var detailParts = [];
    var ongoing = true;
    var rows = doc.select(".detail-row");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var labelEl = safeFirst(row.select(".detail-row__label"));
        var valueEl = safeFirst(row.select(".detail-row__value"));
        if (labelEl === null || valueEl === null) continue;
        var label = cleanText(labelEl.text());
        var value = cleanText(valueEl.text());
        if (!label || !value) continue;
        if (label === "Thể Loại" || label === "Tên" || label === "Tên Khác") continue;
        if (label === "Tập mới nhất" || label === "Thông Tin Khác" || label === "Đánh Giá") {
            detailParts.push(label + ": " + value);
        }
        if (label === "Thông Tin Khác" && value.indexOf("Đang chiếu") === -1 && value.indexOf("Hoàn thành") !== -1) {
            ongoing = false;
        }
    }
    var bodyText = cleanText(doc.text());
    if (bodyText.indexOf("Hoàn Thành") !== -1 && bodyText.indexOf("Đang chiếu") === -1) {
        ongoing = false;
    }

    var genres = [];
    var seen = {};
    var tags = doc.select("span.genre-tag");
    var j = 0;
    for (j = 0; j < tags.size(); j++) {
        var g = cleanText(tags.get(j).text());
        if (!g || seen[g]) continue;
        seen[g] = true;
        var input = genreInputFor(g);
        if (!input) continue;
        genres.push({ title: g, input: input, script: "search.js" });
    }

    var suggests = [];
    var seenSug = {};
    var cards = doc.select(".movie-item");
    var s = 0;
    for (s = 0; s < cards.size() && suggests.length < 12; s++) {
        var item = parseFilmCard(cards.get(s));
        if (item && !seenSug[item.link] && item.link !== url) {
            seenSug[item.link] = true;
            suggests.push(item);
        }
    }

    return Response.success({
        name: name,
        author: "HH3D",
        cover: cover,
        description: desc,
        detail: detailParts.join(" · "),
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
