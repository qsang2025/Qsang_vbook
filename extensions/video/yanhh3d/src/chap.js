// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server phat
// cua mot tap phim tren yanhh3d.baby (/<slug>/tap-<N>).
// Mo trang xem Thuyet Minh lay 5 nut server (1080/1080-/HD/4K/4K-),
// mo them trang /sever2/... lay 5 nut Vietsub. Moi server chi dong goi
// data-src + nhan + trang xem; link stream that do track.js giai luc
// bam Play (token theo gio, het han nhanh).
// Nap: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function serversFromWatch(watchUrl, audioLabel) {
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(watchUrl, MIRROR_LIST);
    if (!doc) return [];
    var found = parseWatchServers(doc);
    var out = [];
    var i = 0;
    for (i = 0; i < found.length; i++) {
        out.push({
            title: found[i].label + " — " + audioLabel,
            data: JSON.stringify({
                kind: found[i].kind,
                src: found[i].src,
                watch: watchUrl,
                label: found[i].label,
                audio: audioLabel
            })
        });
    }
    return out;
}

function execute(url) {
    url = normalizeUrl(url);
    var info = watchSlugAndEp(url);
    var tmUrl = url;
    if (info.sever2) {
        tmUrl = url.replace(/\/sever2\//i, "/");
    }

    var servers = serversFromWatch(tmUrl, "Thuyết Minh");
    var sv2Url = toSever2Url(tmUrl);
    if (sv2Url !== tmUrl) {
        var vsServers = serversFromWatch(sv2Url, "Vietsub");
        var i = 0;
        for (i = 0; i < vsServers.length; i++) {
            servers.push(vsServers[i]);
        }
    }

    if (servers.length === 0) {
        return Response.error("Tập này chưa có server phát trên YanHH3D, hãy thử tập khác.");
    }

    servers.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({
            type: "web",
            url: tmUrl
        })
    });
    return Response.success(servers);
}
