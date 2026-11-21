// detail.js — thong tin chi tiet mot phim tren hhkungfu.ee.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = toDetailUrl(url);
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var name = "";
    var h1 = safeFirst(doc.select("h1.entry-title"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var ogTitle = safeFirst(doc.select("meta[property=og:title]"));
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name.replace(/\s*-\s*Hoạt Hình 3D.*$/i, "").replace(/\s*\|\s*HHPanda.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var ogImg = safeFirst(doc.select("meta[property=og:image]"));
    if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    if (!cover) {
        var poster = safeFirst(doc.select("img.film-poster-img, img.wp-post-image"));
        if (poster !== null) cover = unwrapCover(poster.attr("data-src") || poster.attr("data-original") || poster.attr("src"));
    }

    var orig = "";
    var orgEl = safeFirst(doc.select("h2.org_title, p.org_title"));
    if (orgEl !== null) orig = cleanText(orgEl.text());

    var descParts = [];
    var descEls = doc.select(".halim-entry-box article p");
    if (descEls.size() === 0) descEls = doc.select(".entry-content p");
    var i = 0;
    for (i = 0; i < descEls.size(); i++) {
        var pt = cleanText(descEls.get(i).text());
        if (pt) descParts.push(pt);
    }
    var desc = descParts.join("\n\n");
    if (!desc) {
        var ogDesc = safeFirst(doc.select("meta[property=og:description], meta[name=description]"));
        if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));
    }

    var latest = "";
    var newEp = safeFirst(doc.select(".hh3d-new-ep .new-ep"));
    if (newEp !== null) latest = cleanText(newEp.text());

    var status = "";
    var views = "";
    var infoEls = doc.select(".hh3d-info");
    for (i = 0; i < infoEls.size(); i++) {
        var el = infoEls.get(i);
        var labelEl = safeFirst(el.select("> div"));
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
        var link = absUrl(href).replace(/\/+$/, "");
        if (seen[link]) continue;
        seen[link] = true;
        genres.push({ title: t, input: link, script: "search.js" });
    }

    var lowerStatus = status.toLowerCase();
    var lowerLatest = latest.toLowerCase();
    var ongoing = lowerStatus.indexOf("hoàn") === -1 && lowerLatest.indexOf("hoàn") === -1;
    if (ongoing && lowerStatus.indexOf("đang") === -1) {
        var ratioMatch = latest.match(/(\d+)\s*\/\s*(\d+)/);
        if (ratioMatch && parseInt(ratioMatch[2], 10) > 1 && ratioMatch[1] === ratioMatch[2]) {
            ongoing = false;
        }
    }

    return Response.success({
        name: name,
        author: orig || "HHPanda",
        cover: cover,
        description: desc,
        detail: detailParts.join(" - "),
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: genres
    });
}
