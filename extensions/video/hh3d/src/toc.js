// toc.js — muc luc cac tap cua mot phim tren HH3D (hh3d.ad).
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
    if (!doc) return Response.error("Không tải được danh sách tập: " + url);

    var epLinks = doc.select("a[href*='/tap-']");
    var seen = {};
    var list = [];
    var i = 0;
    for (i = 0; i < epLinks.size(); i++) {
        var a = epLinks.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var epUrl = absUrl(href).replace(/\/+$/, "") + "/";
        if (seen[epUrl]) continue;
        seen[epUrl] = true;
        var num = episodeNumber(epUrl) || episodeNumber(a.text());
        list.push({
            num: num,
            name: num > 0 ? ("Tập " + num) : (cleanText(a.text()) || "Tập Full"),
            url: epUrl
        });
    }

    if (list.length === 0) return Response.error("Phim này chưa có tập nào: " + url);

    list.sort(function (x, y) { return x.num - y.num; });

    var chapters = [];
    for (i = 0; i < list.length; i++) {
        chapters.push({
            name: list[i].name,
            url: list[i].url,
            description: "",
            lock: false,
            pay: false
        });
    }
    return Response.success(chapters);
}
