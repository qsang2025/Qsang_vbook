// toc.js — muc luc cac tap cua mot phim tren HHTQ IO (hhtq.io).
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
    if (!doc) return Response.error("Không tải được danh sách tập: " + url);

    var epLinks = doc.select("a[href*='/xem/']");
    var byNum = {};
    var list = [];
    var i = 0;
    for (i = 0; i < epLinks.size(); i++) {
        var a = epLinks.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var cleanHref = absUrl(href).split("?")[0];
        var num = episodeNumber(cleanHref);
        if (num <= 0) num = episodeNumber(a.text());
        var key = num > 0 ? String(num) : cleanHref;
        if (byNum[key]) continue;
        byNum[key] = true;
        list.push({
            num: num,
            name: num > 0 ? ("Tập " + num) : (cleanText(a.text()) || "Tập Full"),
            url: cleanHref
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
