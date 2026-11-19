// detail.js — thong tin chi tiet mot phim tren hhtq.press.
// Tra ve {name, author (dao dien), cover, description, detail, url,
// type video, format series, ongoing, genres (chip chuyen muc tro ve
// search.js)}. Selector theo theme HalimMovies (khao sat 2026-11-20).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var name = cleanText(doc.select("h1.entry-title").text());
    if (!name) return Response.error("Không đọc được tên phim (site có thể đã đổi giao diện): " + url);

    var cover = "";
    var coverEl = doc.select("img.movie-thumb").first();
    if (coverEl !== null) cover = String(coverEl.attr("src") || "");
    if (!cover) {
        var og = doc.select("meta[property=og:image]").first();
        if (og !== null) cover = String(og.attr("content") || "");
    }
    if (cover) cover = absUrl(cover);

    var directors = cleanText(doc.select("p.directors").text()).replace(/^Đạo diễn:\s*/, "");
    var orgTitle = cleanText(doc.select("p.org_title").text());
    var year = cleanText(doc.select("p.released a").text());
    var episodeText = cleanText(doc.select("p.episode").text());
    var country = cleanText(doc.select("p.actors a").text());

    var descEl = doc.select(".entry-content .item-content").first();
    var description = descEl === null ? "" : descEl.html();

    var info = "";
    if (orgTitle) info += "Tên gốc: " + orgTitle;
    if (year) info += (info ? " - " : "") + "Năm: " + year;
    if (episodeText) info += (info ? " - " : "") + episodeText;
    if (country) info += (info ? " - " : "") + "Quốc gia: " + country;
    if (directors) info += (info ? " - " : "") + "Đạo diễn: " + directors;

    var genres = [];
    var seen = {};
    var cats = doc.select("p.category a");
    var i = 0;
    for (i = 0; i < cats.size(); i++) {
        var a = cats.get(i);
        var href = String(a.attr("href") || "");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        genres.push({ title: title, input: link, script: "search.js" });
    }

    return Response.success({
        name: name,
        author: directors || orgTitle || "",
        cover: cover,
        description: description,
        detail: info,
        url: url,
        type: "video",
        format: "series",
        ongoing: episodeText.indexOf("Hoàn") === -1,
        genres: genres
    });
}
