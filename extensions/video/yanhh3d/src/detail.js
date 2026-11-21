// detail.js — thong tin chi tiet mot phim tren yanhh3d.baby.
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
    var h1 = safeFirst(doc.select("h1.film-name"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var ogTitle = safeFirst(doc.select("meta[property=og:title]"));
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    name = name.replace(/\s*-\s*YanHH3D.*$/i, "").replace(/\s*\|\s*YanHH3D.*$/i, "").trim();
    if (!name) return Response.error("Không đọc được tên phim: " + url);

    var cover = "";
    var poster = safeFirst(doc.select("img.film-poster-img"));
    if (poster !== null) {
        cover = unwrapCover(poster.attr("data-src") || poster.attr("data-original") || poster.attr("src"));
    }
    if (!cover) {
        var anisCover = safeFirst(doc.select(".anis-cover"));
        if (anisCover !== null) {
            var style = String(anisCover.attr("style") || "");
            var sm = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
            if (sm && sm[1]) cover = unwrapCover(sm[1]);
        }
    }
    if (!cover) {
        var ogImg = safeFirst(doc.select("meta[property=og:image]"));
        if (ogImg !== null) cover = unwrapCover(ogImg.attr("content"));
    }

    var desc = "";
    var ogDesc = safeFirst(doc.select("meta[property=og:description], meta[name=description]"));
    if (ogDesc !== null) desc = cleanText(ogDesc.attr("content"));

    var latest = "";
    var latestUrl = "";
    var playBtn = safeFirst(doc.select("a.btn-play"));
    if (playBtn !== null) {
        latestUrl = String(playBtn.attr("href") || "");
        var lt = cleanText(playBtn.text());
        var lm = lt.match(/Tập\s*(\d+)/i);
        if (lm) latest = "Tập " + lm[1];
    }
    if (!latest) {
        var items = doc.select(".item-list");
        var i = 0;
        for (i = 0; i < items.size(); i++) {
            var it = cleanText(items.get(i).text());
            if (it.indexOf("Tập mới nhất") !== -1) {
                var a = safeFirst(items.get(i).select("a"));
                if (a !== null) {
                    latest = cleanText(a.text());
                    if (!latestUrl) latestUrl = String(a.attr("href") || "");
                }
                break;
            }
        }
    }
    var latestNum = episodeNumber(latestUrl || latest);

    var ongoing = true;
    var tick = safeFirst(doc.select(".tick-rate"));
    if (tick !== null) {
        var tm = cleanText(tick.text()).match(/(\d+)\s*\/\s*(\d+)/);
        if (tm) {
            ongoing = parseInt(tm[1], 10) < parseInt(tm[2], 10);
        }
    }
    var bodyText = cleanText(doc.text());
    if (bodyText.indexOf("Hoàn Thành") !== -1 && bodyText.indexOf("Tập mới nhất") === -1) {
        ongoing = false;
    }

    var detailParts = [];
    if (latest) detailParts.push("Tập mới nhất: " + latest);

    var genres = [];
    var seen = {};
    var ldScripts = doc.select("script[type=application/ld+json]");
    var j = 0;
    for (j = 0; j < ldScripts.size(); j++) {
        var raw = "";
        try { raw = String(ldScripts.get(j).html() || ""); } catch (e0) { raw = ""; }
        if (!raw || raw.indexOf("TVSeries") === -1) continue;
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e1) { obj = null; }
        if (!obj || !obj.genre) continue;
        var glist = obj.genre;
        var k = 0;
        for (k = 0; k < glist.length; k++) {
            var g = cleanText(String(glist[k] || ""));
            if (!g) continue;
            var slug = slugifyVn(g);
            if (!slug || seen[slug]) continue;
            seen[slug] = true;
            genres.push({ title: g, input: "/the-loai/" + slug, script: "search.js" });
        }
        break;
    }

    var suggests = [];
    var seenSug = {};
    var cards = doc.select(".flw-item");
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
        author: "YanHH3D",
        cover: cover,
        description: desc,
        detail: detailParts.join(" - "),
        url: url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
