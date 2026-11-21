// toc.js — muc luc cac tap cua mot phim tren hh3d.ad.
// Trang chi tiet liet ke day du tap trong .episodes-grid
// (a.episode-item[href], sap xep giam dan Tap N -> Tap 1 tren trang).
// Sap xep lai tang dan Tap 1 -> N truoc khi tra ve.
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
    if (!doc) return Response.error("Không tải được danh sách tập: " + url);

    var eps = [];
    var seen = {};
    var links = doc.select("a.episode-item[href]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        if (!href || href.indexOf("/tap-") === -1) continue;
        var fullUrl = absUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;
        var num = episodeNumber(href) || episodeNumber(a.text());
        eps.push({ num: num, url: fullUrl });
    }
    if (eps.length === 0) {
        var anyTap = safeFirst(doc.select("a[href*='/tap-']"));
        if (anyTap !== null) {
            var oneUrl = absUrl(String(anyTap.attr("href") || ""));
            var oneNum = episodeNumber(oneUrl);
            return Response.success([{
                name: oneNum > 0 ? ("Tập " + oneNum) : "Tập 1",
                url: oneUrl,
                description: "",
                lock: false,
                pay: false
            }]);
        }
        return Response.error("Phim này chưa có tập nào để xem: " + url);
    }

    eps.sort(function (x, y) { return x.num - y.num; });
    var episodes = [];
    var k = 0;
    for (k = 0; k < eps.length; k++) {
        episodes.push({
            name: eps[k].num > 0 ? ("Tập " + eps[k].num) : "Tập Full",
            url: eps[k].url,
            description: "",
            lock: false,
            pay: false
        });
    }
    return Response.success(episodes);
}
