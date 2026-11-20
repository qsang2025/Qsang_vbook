// toc.js — muc luc cac tap cua mot phim tren hhkungfu.ee.
// Danh sach tap nam trong cac khoi .halim-server (#Vietsub sv=1,
// #Thuyết Minh sv=2), moi tap la a[data-ep]. Sap xep tang dan Tap 1 -> N.
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
    if (!doc) return Response.error("Không tải được danh sách tập: " + url);

    var groups = doc.select(".halim-server");
    var multi = groups.size() > 1;
    var episodes = [];
    var seenUrl = {};
    var i = 0;

    for (i = 0; i < groups.size(); i++) {
        var g = groups.get(i);
        var gname = "";
        var nm = g.select(".halim-server-name").first();
        if (nm !== null) gname = cleanText(nm.text()).replace(/^#/, "").replace(/:\s*$/, "");
        var isVietsub = gname.toLowerCase().indexOf("vietsub") !== -1;

        var list = [];
        var links = g.select("a[data-ep]");
        var j = 0;
        for (j = 0; j < links.size(); j++) {
            var a = links.get(j);
            var n = episodeNumber(a.attr("data-ep") || a.text());
            var href = String(a.attr("href") || "");
            if (!href || n === 0) continue;
            var fullUrl = absUrl(href);
            if (seenUrl[fullUrl]) continue;
            seenUrl[fullUrl] = true;
            var title = "Tập " + n;
            if (multi && !isVietsub && gname) title += " (" + gname + ")";
            list.push({ n: n, name: title, url: fullUrl });
        }
        list.sort(function (x, y) { return x.n - y.n; });
        for (j = 0; j < list.length; j++) {
            episodes.push({
                name: list[j].name,
                url: list[j].url,
                description: "",
                lock: false,
                pay: false
            });
        }
    }

    if (episodes.length === 0) return Response.error("Chưa có tập nào cho phim này: " + url);
    return Response.success(episodes);
}
