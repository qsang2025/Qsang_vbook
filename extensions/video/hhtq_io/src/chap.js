// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server cua
// mot tap phim tren HHTQ IO (hhtq.io/xem/<slug>/tap-<N>).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var tracks = [];
    var seen = {};

    tracks.push({ title: "Server Mặc Định (HLS/MP4)", data: url });
    seen[url] = true;

    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (doc) {
        var svLinks = doc.select("a[href*='?server=']");
        var i = 0;
        for (i = 0; i < svLinks.size(); i++) {
            var a = svLinks.get(i);
            var href = String(a.attr("href") || "");
            if (!href) continue;
            var full = absUrl(href);
            if (seen[full]) continue;
            seen[full] = true;
            var label = cleanText(a.text()) || ("Server " + (tracks.length + 1));
            tracks.push({ title: label, data: full });
        }
    }

    tracks.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({ type: "web", url: url })
    });
    return Response.success(tracks);
}
