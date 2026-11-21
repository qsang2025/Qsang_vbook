// toc.js — muc luc cac tap cua mot phim tren hhkungfu.ee.
// Danh sach tap nam trong cac khoi .halim-server (#Vietsub sv=1,
// #Thuyet Minh sv=2), moi tap la a[data-ep]. Sap xep tang dan Tap 1 -> N.
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
    if (!doc) return Response.error("Không tải được danh sách tập: " + url);

    var groups = doc.select(".halim-server");
    var multi = groups.size() > 1;
    var episodes = [];
    var seenUrl = {};
    var i = 0;

    for (i = 0; i < groups.size(); i++) {
        var g = groups.get(i);
        var gname = "";
        var nm = safeFirst(g.select(".halim-server-name"));
        if (nm !== null) gname = cleanText(nm.text()).replace(/^#/, "").replace(/:\s*$/, "");
        var isVietsub = gname.toLowerCase().indexOf("vietsub") !== -1;

        var numbered = [];
        var specials = [];
        var links = g.select("a[data-ep]");
        var j = 0;
        for (j = 0; j < links.size(); j++) {
            var a = links.get(j);
            var epAttr = String(a.attr("data-ep") || "");
            var rawText = cleanText(a.text());
            var href = String(a.attr("href") || "");
            if (!href) continue;
            var fullUrl = absUrl(href);
            if (seenUrl[fullUrl]) continue;
            seenUrl[fullUrl] = true;

            var key = episodeSortKey(epAttr, rawText);
            var title = "";
            if (key > 0) {
                title = (Math.floor(key) === key) ? ("Tập " + key) : (rawText || ("Tập " + key));
            } else {
                title = rawText || "Tập Full";
            }
            if (multi && !isVietsub && gname) title += " (" + gname + ")";

            if (key > 0) {
                numbered.push({ k: key, idx: j, name: title, url: fullUrl });
            } else {
                specials.push({ idx: j, name: title, url: fullUrl });
            }
        }
        numbered.sort(function (x, y) {
            if (x.k !== y.k) return x.k - y.k;
            return y.idx - x.idx;
        });
        for (j = 0; j < numbered.length; j++) {
            episodes.push({
                name: numbered[j].name,
                url: numbered[j].url,
                description: "",
                lock: false,
                pay: false
            });
        }
        for (j = specials.length - 1; j >= 0; j--) {
            episodes.push({
                name: specials[j].name,
                url: specials[j].url,
                description: "",
                lock: false,
                pay: false
            });
        }
    }

    if (episodes.length === 0) return Response.error("Chưa có tập nào cho phim này: " + url);
    return Response.success(episodes);
}
