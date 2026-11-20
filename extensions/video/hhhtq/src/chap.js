// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server cua 1 tap
// phim tren hhhtq.team (/xem/<id>-sv<n>-ep<m>/).
// Trang xem phim da chua san danh sach server cua tap do trong .server-list
// va cac khoi #glist-1..4 / #playlist1..4, nen chi can fetch 1 trang.
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

    if (doc) {
        var links = doc.select(".server-list a[href*='/xem/'], a[href*='/xem/" + movieId + "-sv']");
        var i = 0;
        for (i = 0; i < links.size(); i++) {
            var href = String(links.get(i).attr("href") || "");
            var sm = href.match(new RegExp("/xem/" + movieId + "-sv(\\d+)-ep" + epNum + "/?$", "i"));
            if (sm) addSv(sm[1]);
        }
    }
    addSv(currentSv);
    svList.sort(function (a, b) { return a - b; });

    var tracks = [];
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
