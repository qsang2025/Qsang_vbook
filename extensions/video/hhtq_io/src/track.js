// track.js (video: buoc 2 cua chap -> track) — giai chuoi watch ->
// <iframe class="watch-frame" src=".../?embed=<id>"> -> data-src
// (yanhh3d.blog/sever2/... hoac player truc tiep) -> resolveStreamrptPlayer /
// resolveFbPlayer -> fallback PhimAPI -> webview.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function nativeTrack(streamUrl, referer) {
    var ref = referer || (BASE_URL + "/");
    var isMp4 = streamUrl.indexOf(".mp4") !== -1;
    return Response.success({
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: isMp4 ? "video/mp4" : "application/x-mpegURL",
        headers: { "Referer": ref },
        timeSkip: []
    });
}

function webviewTrack(watchUrl) {
    return Response.success({
        type: "webview",
        data: watchUrl || (BASE_URL + "/"),
        host: siteOrigin(),
        headers: { "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}

function resolvePhimApiFallback(watchUrl) {
    var info = watchSlugAndEp(watchUrl);
    if (!info || !info.slug) return "";
    var json = fetchJson("https://phimapi.com/phim/" + info.slug, { referer: "https://phimapi.com/" });
    if (!json || !json.episodes || !(json.episodes instanceof Array)) return "";
    var epNum = info.ep || 1;
    var s = 0;
    for (s = 0; s < json.episodes.length; s++) {
        var srv = json.episodes[s];
        var data = (srv && srv.server_data) ? srv.server_data : [];
        var j = 0;
        for (j = 0; j < data.length; j++) {
            var item = data[j];
            if (!item || !item.link_m3u8) continue;
            var n = episodeNumber(item.slug) || episodeNumber(item.name);
            if (n === epNum || (epNum <= 1 && String(item.slug || "").toLowerCase() === "full")) {
                return String(item.link_m3u8);
            }
        }
    }
    return "";
}

function resolveDataSrc(dataSrc, referer) {
    var cleanSrc = String(dataSrc || "").split("#")[0].replace(/^\s+|\s+$/g, "");
    if (!cleanSrc) return null;

    if (cleanSrc.indexOf("yanhh3d.") !== -1 && cleanSrc.indexOf("/tap-") !== -1) {
        var yDoc = fetchDoc(cleanSrc, { referer: referer || BASE_URL + "/" });
        if (yDoc) {
            var btns = parseYanhh3dWatchServers(yDoc);
            var i = 0;
            for (i = 0; i < btns.length; i++) {
                var b = btns[i];
                if (b.kind === "m3u8") {
                    var p1 = resolveStreamrptPlayer(b.src, cleanSrc);
                    if (p1 && p1.stream) return p1;
                } else if (b.kind === "fb") {
                    var fb1 = resolveFbPlayer(b.src, cleanSrc);
                    if (fb1 && fb1.stream) return fb1;
                }
            }
        }
        return null;
    }

    if (cleanSrc.indexOf("play-fb-v8") !== -1) {
        return resolveFbPlayer(cleanSrc, referer);
    }

    if (cleanSrc.indexOf("streamrpt") !== -1) {
        return resolveStreamrptPlayer(cleanSrc, referer);
    }

    if (/\.(m3u8|mp4)(\?|$)/i.test(cleanSrc)) {
        var p2 = resolveStreamrptPlayer(cleanSrc, referer);
        if (p2 && p2.stream) return p2;
        return { stream: cleanSrc, referer: referer || BASE_URL + "/" };
    }

    return null;
}

function execute(input) {
    input = String(input === undefined || input === null ? "" : input).trim();
    if (!input) return Response.error("Không có dữ liệu server để phát.");

    if (/\.(m3u8|mp4)(\?|$)/i.test(input)) {
        return nativeTrack(input, BASE_URL + "/");
    }

    if (input.indexOf("{") === 0) {
        try {
            var payload = JSON.parse(input);
            if (payload && payload.type === "web" && payload.url) {
                return webviewTrack(normalizeUrl(payload.url));
            }
        } catch (e0) {
        }
    }

    var watchUrl = normalizeUrl(input);
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(watchUrl);
    if (doc) {
        var iframe = safeFirst(doc.select("iframe.watch-frame"));
        if (iframe === null) iframe = safeFirst(doc.select("iframe[src*='embed='], iframe[data-player-src*='embed=']"));
        if (iframe !== null) {
            var embedSrc = String(iframe.attr("src") || iframe.attr("data-player-src") || "");
            if (embedSrc) {
                var embedUrl = absUrl(embedSrc);
                var emDoc = fetchDoc(embedUrl, { referer: watchUrl });
                if (emDoc) {
                    var els = emDoc.select("[data-src]");
                    var k = 0;
                    for (k = 0; k < els.size(); k++) {
                        var dsrc = String(els.get(k).attr("data-src") || "");
                        var resolved = resolveDataSrc(dsrc, embedUrl);
                        if (resolved && resolved.stream) {
                            return nativeTrack(resolved.stream, resolved.referer || embedUrl);
                        }
                    }
                }
            }
        }
    }

    var apiStream = resolvePhimApiFallback(watchUrl);
    if (apiStream) {
        return nativeTrack(apiStream, "https://phimapi.com/");
    }

    return webviewTrack(watchUrl);
}
