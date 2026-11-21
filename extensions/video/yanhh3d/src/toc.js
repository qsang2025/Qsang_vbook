// toc.js — muc luc cac tap cua mot phim tren yanhh3d.baby.
// Trang chi tiet chi lo tap moi nhat (nut Xem Thuyet Minh) — lay URL tap
// moi nhat do roi mo trang xem: danh sach tap day du nam trong
// #top-comment a.ssl-item (tab Thuyet Minh). Sap xep tang dan Tap 1 -> N.
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

    var watchUrl = "";
    var playBtn = safeFirst(doc.select("a.btn-play"));
    if (playBtn !== null) watchUrl = String(playBtn.attr("href") || "");
    if (!watchUrl) {
        var items = doc.select(".item-list a");
        var i = 0;
        for (i = 0; i < items.size(); i++) {
            var href = String(items.get(i).attr("href") || "");
            if (href.indexOf("/tap-") !== -1) {
                watchUrl = href;
                break;
            }
        }
    }
    if (!watchUrl) return Response.error("Phim này chưa có tập nào để xem: " + url);
    watchUrl = absUrl(watchUrl);

    rateLimitDelay(siteOrigin(), 400, 1000);
    var wdoc = fetchDocWithFallback(watchUrl, MIRROR_LIST);
    if (!wdoc) return Response.error("Không tải được trang tập phim: " + watchUrl);

    var eps = parseWatchEpisodes(wdoc);
    if (eps.length === 0) {
        var num = episodeNumber(watchUrl);
        return Response.success([{
            name: num > 0 ? ("Tập " + num) : "Tập 1",
            url: watchUrl,
            description: "",
            lock: false,
            pay: false
        }]);
    }

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
