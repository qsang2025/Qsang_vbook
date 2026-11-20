// detail.js — thong tin chi tiet mot phim tren hhkungfu.ee.
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
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var h1 = doc.select("h1.entry-title, h1").first();
    var name = h1 !== null ? cleanText(h1.text()) : "";
    if (!name) {
        var ogTitle = doc.select("meta[property=og:title]").first();
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name.replace(/\s*-\s*Hoạt Hình 3D.*$/i, "").replace(/\s*\|\s*HHKUNGFU.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var ogImg = doc.select("meta[property=og:image]").first();
    if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    if (!cover) {
        var poster = doc.select("img.film-poster-img, img.wp-post-image").first();
        if (poster !== null) cover = unwrapCover(poster.attr("data-src") || poster.attr("src"));
    }

    var orig = "";
    var orgEl = doc.select("h2.org_title, p.org_title").first();
    if (orgEl !== null) orig = cleanText(orgEl.text());

    var desc = "";
    var descEl = doc.select(".halim-entry-box article p, .entry-content p").first();
    if (descEl !== null) desc = cleanText(descEl.text());
    if (!desc) {
        var ogDesc = doc.select("meta[property=og:description]").first();
        if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));
    }

    var latest = "";
    var newEp = doc.select(".hh3d-new-ep .new-ep").first();
    if (newEp !== null) latest = cleanText(newEp.text());

    var status = "";
    var views = "";
    var infoEls = doc.select(".hh3d-info");
    var i = 0;
    for (i = 0; i < infoEls.size(); i++) {
        var el = infoEls.get(i);
        var labelEl = el.select("> div").first();
        var label = labelEl !== null ? cleanText(labelEl.text()) : "";
        var full = cleanText(el.text());
        var value = full;
        if (label && full.indexOf(label) === 0) value = cleanText(full.substring(label.length));
        if (label.indexOf("Tình trạng") !== -1) status = value;
        if (label.indexOf("Lượt xem") !== -1) views = value;
    }

    var detailParts = [];
    if (orig) detailParts.push("Tên gốc: " + orig);
    if (status) detailParts.push("Tình trạng: " + status);
    if (latest) detailParts.push("Tập mới nhất: " + latest);
    if (views) detailParts.push("Lượt xem: " + views);

    var genres = [];
    var seen = {};
    var cats = doc.select(".list_cate a[href*='/category/']");
    for (i = 0; i < cats.size(); i++) {
        var a = cats.get(i);
        var t = cleanText(a.text());
        var href = String(a.attr("href") || "");
        if (!t || !href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        genres.push({ title: t, input: link, script: "search.js" });
    }

    return Response.success({
        name: name,
        author: orig || "HHKUNGFU",
        cover: cover,
        description: desc,
        detail: detailParts.join(" - "),
        url: url,
        type: "video",
        format: "series",
        ongoing: status.indexOf("Hoàn thành") === -1 && latest.toLowerCase().indexOf("hoàn") === -1,
        genres: genres
    });
}
