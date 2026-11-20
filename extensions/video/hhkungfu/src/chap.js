// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server phat cua
// mot tap phim tren hhkungfu.ee (/watch-<slug>/tap-<N>-sv<S>.html).
// Doc data-post-id / data-ep / data-sv va cac nut server trong
// #halim-ajax-list-server .get-eps (1080P V1 tiktik, 1080P V2 pro,
// 4K V1 vip4k, 4K V2 vip4kv2), kem server du phong Webview Trang Nguon.
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
    if (!doc) return Response.error("Không tải được trang tập phim: " + url);

    var epLink = null;
    var allEps = doc.select("a[data-ep]");
    var i = 0;
    for (i = 0; i < allEps.size(); i++) {
        var a = allEps.get(i);
        var href = absUrl(a.attr("href"));
        if (href === url || href === url + "/") {
            epLink = a;
            break;
        }
    }
    if (epLink === null) {
        var active = doc.select(".halim-episode.active a, a[data-ep].active").first();
        if (active !== null) epLink = active;
    }
    if (epLink === null && allEps.size() > 0) {
        epLink = allEps.first();
    }
    if (epLink === null) {
        return Response.success([{ title: "Webview Trang Nguồn", data: JSON.stringify({ type: "web", url: url }) }]);
    }

    var postId = String(epLink.attr("data-post-id") || "");
    var chapter = String(epLink.attr("data-ep") || "");
    var sv = String(epLink.attr("data-sv") || "1");
    if (!postId || !chapter) {
        return Response.success([{ title: "Webview Trang Nguồn", data: JSON.stringify({ type: "web", url: url }) }]);
    }

    var servers = [];
    var btns = doc.select("#halim-ajax-list-server .get-eps");
    for (i = 0; i < btns.size(); i++) {
        var btn = btns.get(i);
        var type = String(btn.attr("data-type") || "");
        var title = cleanText(btn.text());
        if (!type) continue;
        servers.push({
            title: title || ("Server " + type),
            data: JSON.stringify({
                type: type,
                postId: postId,
                chapter: chapter,
                sv: sv,
                url: url
            })
        });
    }

    if (servers.length === 0) {
        var defaults = [
            { title: "1080P V1", type: "tiktik" },
            { title: "1080P V2", type: "pro" },
            { title: "4K V1", type: "vip4k" },
            { title: "4K V2", type: "vip4kv2" }
        ];
        for (i = 0; i < defaults.length; i++) {
            servers.push({
                title: defaults[i].title,
                data: JSON.stringify({
                    type: defaults[i].type,
                    postId: postId,
                    chapter: chapter,
                    sv: sv,
                    url: url
                })
            });
        }
    }

    servers.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({ type: "web", url: url })
    });
    return Response.success(servers);
}
