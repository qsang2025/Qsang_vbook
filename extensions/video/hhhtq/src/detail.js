// detail.js — thong tin chi tiet mot phim tren hhhtq.team (/phim/<id>/).
// Ho tro ca giao dien Mobile va Desktop cua MacCMS, chap nhan ca URL /xem/...
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
    url = toDetailUrl(normalizeUrl(url));
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var name = "";
    var h1 = doc.select("h1.page-title, h1.title").first();
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var ogTitle = doc.select("meta[property=og:title]").first();
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name
        .replace(/\s*\|\s*Hoạt Hình Trung Quốc.*$/i, "")
        .replace(/\s*\|\s*HHHTQ.*$/i, "")
        .replace(/\s*Tập\s+\d+\s+Server\s+\d+.*$/i, "")
        .trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = extractImgCover(doc.select(".video-cover, .myui-content__thumb").first());
    if (!cover) {
        var ogImg = doc.select("meta[property=og:image]").first();
        if (ogImg !== null) cover = cleanCoverUrl(ogImg.attr("content"));
    }

    var description = "";
    var descEl = doc.select(".video-info-content, span.sketch.content, .myui-panel_bd .data p").first();
    if (descEl !== null) description = cleanText(descEl.text());
    if (!description) {
        var ogDesc = doc.select("meta[property=og:description], meta[name=description]").first();
        if (ogDesc !== null) description = cleanText(ogDesc.attr("content"));
    }

    var statusText = "";
    var subEl = doc.select("h2.video-subtitle").first();
    if (subEl !== null) statusText = cleanText(subEl.text());

    var genres = [];
    var seenGenre = {};
    var tagLinks = doc.select(".video-info-aux a[href], .myui-content__detail a[href*='/type/'], .myui-content__detail a[href*='/show/']");
    var i = 0;
    for (i = 0; i < tagLinks.size(); i++) {
        var a = tagLinks.get(i);
        var href = String(a.attr("href") || "");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        if (href.indexOf("/type/") === -1 && href.indexOf("/show/") === -1) continue;
        var full = absUrl(href);
        if (seenGenre[full]) continue;
        seenGenre[full] = true;
        genres.push({ title: title, input: full, script: "search.js" });
    }

    var detailParts = [];
    if (statusText) detailParts.push("Trạng thái: " + statusText);
    if (genres.length > 0) {
        var gNames = [];
        for (i = 0; i < genres.length; i++) gNames.push(genres[i].title);
        detailParts.push("Phân loại: " + gNames.join(", "));
    }

    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf("full") === -1 && lowerStatus.indexOf("hoàn") === -1;
    var ratioMatch = statusText.match(/(\d+)\s*\/\s*(\d+)/);
    if (ratioMatch && ratioMatch[1] === ratioMatch[2]) ongoing = false;

    return Response.success({
        name: name,
        author: "HHHTQ",
        cover: cover,
        description: description,
        detail: detailParts.join(" - "),
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: genres
    });
}
