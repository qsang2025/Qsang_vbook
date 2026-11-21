// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server cua 1 tap
// phim tren hhhtq.team (/xem/<id>-sv<n>-ep<m>/).
// Trang xem phim da chua san danh sach server cua tap do trong .server-list
// va cac khoi #glist-1..4 / #playlist1..4, nen chi can fetch 1 trang.
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
    url = normalizeUrl(url);
    var m = url.match(/\/xem\/(\d+)-sv(\d+)-ep(\d+)\/?/i);
    if (!m) {
        return Response.success([{ title: "Server 1", data: url }]);
    }
    var movieId = m[1];
    var currentSv = parseInt(m[2], 10) || 1;
    var epNum = m[3];

    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    var svSeen = {};
    var svList = [];

    function addSv(num) {
        var n = parseInt(num, 10);
        if (!isNaN(n) && n > 0 && !svSeen[n]) {
            svSeen[n] = true;
            svList.push(n);
        }
    }

    var filmTitle = "";
    if (doc) {
        var links = doc.select(".server-list a[href*='/xem/'], a[href*='/xem/" + movieId + "-sv']");
        var i = 0;
        for (i = 0; i < links.size(); i++) {
            var href = String(links.get(i).attr("href") || "");
            var sm = href.match(new RegExp("/xem/" + movieId + "-sv(\\d+)-ep" + epNum + "/?$", "i"));
            if (sm) addSv(sm[1]);
        }
        var h1 = safeFirst(doc.select("h1.page-title, h1.title, .video-info-header h1, h1"));
        if (h1 !== null) filmTitle = cleanText(h1.text());
        if (!filmTitle) {
            var og = safeFirst(doc.select("meta[property=og:title]"));
            if (og !== null) filmTitle = cleanText(og.attr("content"));
        }
        if (!filmTitle) {
            var tEl = safeFirst(doc.select("title"));
            if (tEl !== null) filmTitle = cleanText(tEl.text());
        }
        filmTitle = filmTitle
            .replace(/\s*\|\s*Hoạt Hình Trung Quốc.*$/i, "")
            .replace(/\s*\|\s*HHHTQ.*$/i, "")
            .replace(/\s*-?\s*Tập\s+\d+.*$/i, "")
            .trim();
    }
    addSv(currentSv);
    svList.sort(function (a, b) { return a - b; });

    var tracks = [];
    if (filmTitle) {
        tracks.push({
            title: "PhimAPI Native HLS",
            data: JSON.stringify({
                mode: "phimapi",
                title: filmTitle,
                ep: parseInt(epNum, 10) || 1,
                url: url
            })
        });
    }
    var k = 0;
    for (k = 0; k < svList.length; k++) {
        var sv = svList[k];
        var epUrl = BASE_URL + "/xem/" + movieId + "-sv" + sv + "-ep" + epNum + "/";
        tracks.push({
            title: "Server " + sv,
            data: epUrl
        });
    }
    tracks.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({ mode: "webview", url: url })
    });
    return Response.success(tracks);
}
