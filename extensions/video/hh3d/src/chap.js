// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server phat
// cua mot tap phim tren hh3d.ad (/<slug>/tap-<N>/).
// Trang xem nhung truc tiep var all_sources = ["https://.../index.m3u8"]
// (thuong chi 1 link — chinh la link PhimAPI cua tap do; host thay doi
// theo tap). Moi link dong goi thanh 1 server; link stream that do
// track.js giai lai luc bam Play (link CDN het han nhanh).
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
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang tập phim: " + url);

    var html = "";
    try { html = String(doc.html() || ""); } catch (e) { html = ""; }
    var sources = parseAllSources(html);
    if (sources.length === 0) {
        return Response.error("Tập này chưa có server phát trên HH3D, hãy thử tập khác.");
    }

    var servers = [];
    var i = 0;
    for (i = 0; i < sources.length; i++) {
        var label = sources.length > 1 ? ("Server " + (i + 1)) : "Vietsub";
        servers.push({
            title: label,
            data: JSON.stringify({
                kind: "m3u8",
                src: sources[i],
                watch: url,
                index: i
            })
        });
    }

    servers.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({
            type: "web",
            url: url
        })
    });
    return Response.success(servers);
}
