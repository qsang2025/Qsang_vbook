// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server phat cua
// mot tap phim tren hhkungfu.ee (/watch-<slug>/tap-<N>-sv<S>.html).
// Uu tien dat server Native HLS (.m3u8 tu PhimAPI) len dau KHI tim thay
// dung tap phim co link_m3u8 hop le (tranh loi cung track #1 khi thieu tap),
// tiep theo la 4 server player.php cua hhkungfu.ee (1080P V1 tiktik,
// 1080P V2 pro, 4K V1 vip4k, 4K V2 vip4kv2) va Webview Trang Nguon.
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
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang tập phim: " + url);

    var epLink = null;
    var allEps = doc.select("a[data-ep]");
    var i = 0;
    for (i = 0; i < allEps.size(); i++) {
        var a = allEps.get(i);
        var href = absUrl(a.attr("href")).replace(/\/+$/, "");
        var cleanUrl = url.replace(/\/+$/, "");
        if (href === cleanUrl) {
            epLink = a;
            break;
        }
    }
    if (epLink === null) {
        var active = safeFirst(doc.select(".halim-episode.active a, a[data-ep].active"));
        if (active !== null) epLink = active;
    }
    if (epLink === null) {
        epLink = safeFirst(allEps);
    }

    var postId = epLink !== null ? String(epLink.attr("data-post-id") || "") : "";
    var chapter = epLink !== null ? String(epLink.attr("data-ep") || "") : "";
    var sv = epLink !== null ? String(epLink.attr("data-sv") || "1") : "1";

    if (!postId) {
        var mainEl = safeFirst(doc.select("#main-contents"));
        if (mainEl !== null) postId = String(mainEl.attr("data-id") || "");
    }
    var urlParts = url.match(/\/(?:watch|xem-phim)-([^\/]+)\/([^\/\?\.]+?)(?:-sv(\d+))?\.html/i);
    if (!chapter && urlParts) chapter = urlParts[2];
    if ((!sv || sv === "1") && urlParts && urlParts[3]) sv = urlParts[3];

    // Tach thong tin phim (slug, ten phim, so tap, nhom am thanh) de doi chieu PhimAPI.
    var hhSlug = urlParts ? urlParts[1] : "";
    var hhTitle = "";
    var hhOrig = "";
    var postTitleLink = safeFirst(doc.select("h2.halim-post-title a, a.original_title"));
    if (postTitleLink !== null) {
        var pHref = String(postTitleLink.attr("href") || "");
        var sm = pHref.match(/^(?:https?:\/\/[^\/]+)?\/([^\/\?#]+)\/?$/i);
        if (sm && sm[1] && sm[1].indexOf("watch-") !== 0 && sm[1].indexOf("xem-phim-") !== 0) hhSlug = sm[1];
        var rawPair = cleanText(postTitleLink.text());
        var pipeIdx = rawPair.indexOf("|");
        if (pipeIdx !== -1) {
            hhTitle = cleanText(rawPair.substring(0, pipeIdx));
            hhOrig = cleanText(rawPair.substring(pipeIdx + 1));
        } else {
            hhTitle = rawPair;
        }
    }
    if (!hhTitle) {
        var h1 = safeFirst(doc.select("h1.entry-title"));
        if (h1 !== null) {
            hhTitle = cleanText(h1.text())
                .replace(/\s*Tập\s+.*$/i, "")
                .replace(/\s*(?:Vietsub|Thuyết Minh).*$/i, "")
                .trim();
        }
    }

    var isFull = /full/i.test(chapter);
    var targetEp = episodeNumber(chapter);
    var h1El = safeFirst(doc.select("h1.entry-title"));
    var h1Text = h1El !== null ? cleanText(h1El.text()).toLowerCase() : "";
    var preferDub = (sv === "2") || (h1Text.indexOf("thuyết minh") !== -1);
    var isSeries = allEps.size() > 2 || (targetEp > 1);

    var nativeMatches = resolvePhimApiTracks(hhSlug, hhTitle, hhOrig, targetEp, isFull, isSeries, preferDub);
    var hhtqStream = resolveHhtqPressStream(hhSlug, hhTitle, chapter, targetEp, sv);

    var servers = [];
    for (i = 0; i < nativeMatches.primary.length; i++) {
        servers.push(nativeMatches.primary[i]);
    }
    if (hhtqStream && hhtqStream.url) {
        if (nativeMatches.primary.length > 0) {
            servers.push({
                title: "Native HD (Server 2)",
                data: JSON.stringify({
                    type: "native",
                    stream: hhtqStream.url,
                    referer: hhtqStream.referer || ""
                })
            });
        } else {
            servers.push({
                title: preferDub ? "Native HLS (Thuyết Minh)" : "Native HLS (Vietsub)",
                data: JSON.stringify({
                    type: "native",
                    stream: hhtqStream.url,
                    referer: hhtqStream.referer || ""
                })
            });
        }
    }
    if (nativeMatches.secondary.length > 0) {
        for (i = 0; i < nativeMatches.secondary.length; i++) {
            servers.push(nativeMatches.secondary[i]);
        }
    }

    var bestNativeStream = (hhtqStream && hhtqStream.url) ? hhtqStream.url : "";
    var bestNativeReferer = (hhtqStream && hhtqStream.url) ? (hhtqStream.referer || "") : "";
    if (!bestNativeStream && nativeMatches.primary.length > 0) {
        bestNativeStream = nativeMatches.primary[0].data;
    } else if (!bestNativeStream && nativeMatches.secondary.length > 0) {
        bestNativeStream = nativeMatches.secondary[0].data;
    }

    if (postId && chapter) {
        var playerServers = [];
        var btns = doc.select("#halim-ajax-list-server .get-eps");
        for (i = 0; i < btns.size(); i++) {
            var btn = btns.get(i);
            var type = String(btn.attr("data-type") || "");
            var title = cleanText(btn.text());
            if (!type) continue;
            playerServers.push({
                title: title || ("Server " + type),
                data: JSON.stringify({
                    type: type,
                    postId: postId,
                    chapter: chapter,
                    sv: sv,
                    url: url,
                    hhSlug: hhSlug,
                    hhTitle: hhTitle,
                    targetEp: targetEp,
                    resolvedStream: bestNativeStream,
                    resolvedReferer: bestNativeReferer
                })
            });
        }
        if (playerServers.length === 0) {
            var defaults = [
                { title: "1080P V1", type: "tiktik" },
                { title: "1080P V2", type: "pro" },
                { title: "4K V1", type: "vip4k" },
                { title: "4K V2", type: "vip4kv2" }
            ];
            for (i = 0; i < defaults.length; i++) {
                playerServers.push({
                    title: defaults[i].title,
                    data: JSON.stringify({
                        type: defaults[i].type,
                        postId: postId,
                        chapter: chapter,
                        sv: sv,
                        url: url,
                        hhSlug: hhSlug,
                        hhTitle: hhTitle,
                        targetEp: targetEp,
                        resolvedStream: bestNativeStream,
                        resolvedReferer: bestNativeReferer
                    })
                });
            }
        }
        for (i = 0; i < playerServers.length; i++) {
            servers.push(playerServers[i]);
        }
    }

    servers.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({
            type: "web",
            url: url,
            hhSlug: hhSlug,
            hhTitle: hhTitle,
            targetEp: targetEp,
            chapter: chapter,
            sv: sv,
            resolvedStream: bestNativeStream,
            resolvedReferer: bestNativeReferer
        })
    });
    return Response.success(servers);
}
