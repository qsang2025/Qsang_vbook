// track.js (video: buoc 2 cua chap -> track) — giai URL tap phim hoac
// server embed cua hhhtq.team thanh stream phat duoc:
//   1. Link .m3u8/.mp4 truc tiep hoac DU server (bysezejataos.com) -> native.
//   2. Dailymotion (geo.dailymotion.com / dailymotion.com / dai.ly) -> goi
//      metadata API lay link .m3u8 CDN goc -> native.
//   3. Archive.org (archive.org/embed/<id>) -> goi metadata API lay file
//      .mp4 truc tiep -> native.
//   4. Cac server embed khac (Abyss, Rumble...): thu boc link stream trong
//      HTML hoac Engine.newBrowser(), cuoi cung fallback webview.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function nativeTrack(streamUrl, referer) {
    var ref = referer || (BASE_URL + "/");
    return Response.success({
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: streamUrl.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
        headers: { "Referer": ref },
        timeSkip: []
    });
}

function webviewTrack(targetUrl, pageReferer) {
    var ref = pageReferer || (BASE_URL + "/");
    return Response.success({
        type: "webview",
        data: targetUrl,
        host: originOf(targetUrl),
        headers: { "Referer": ref },
        timeSkip: []
    });
}

function extractDailymotionId(url) {
    var s = String(url || "");
    var m = s.match(/[?&]video=([a-zA-Z0-9]+)/i);
    if (m) return m[1];
    m = s.match(/dailymotion\.com\/(?:embed\/)?video\/([a-zA-Z0-9]+)/i);
    if (m) return m[1];
    m = s.match(/dai\.ly\/([a-zA-Z0-9]+)/i);
    if (m) return m[1];
    return "";
}

function resolveDailymotionM3u8(embedUrl) {
    var vid = extractDailymotionId(embedUrl);
    if (!vid) return "";
    var apiUrl = "https://www.dailymotion.com/player/metadata/video/" + vid;
    var r = null;
    try {
        r = pacedFetch(apiUrl, {
            referer: BASE_URL + "/",
            timeout: 30000
        });
    } catch (e) {
        return "";
    }
    if (!r || !r.ok || !r.res) return "";
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return ""; }
    if (!text) return "";
    try {
        var meta = JSON.parse(text);
        if (meta && meta.qualities && meta.qualities.auto && meta.qualities.auto.length > 0) {
            var u = meta.qualities.auto[0].url;
            if (u) return String(u);
        }
    } catch (e3) {
    }
    return "";
}

function resolveArchiveMp4(embedUrl) {
    var s = String(embedUrl || "");
    var m = s.match(/archive\.org\/embed\/([^\/?#&"']+)/i);
    if (!m) return "";
    var itemId = m[1];
    var apiUrl = "https://archive.org/metadata/" + itemId;
    var r = null;
    try {
        r = pacedFetch(apiUrl, {
            referer: BASE_URL + "/",
            timeout: 30000
        });
    } catch (e) {
        return "";
    }
    if (r && r.ok && r.res) {
        try {
            var meta = JSON.parse(String(r.res.text() || ""));
            if (meta && meta.files && meta.files.length > 0) {
                var i = 0;
                for (i = 0; i < meta.files.length; i++) {
                    var fname = String(meta.files[i].name || "");
                    if (/\.mp4$/i.test(fname)) {
                        return "https://archive.org/download/" + itemId + "/" + encodeURIComponent(fname).replace(/%2F/g, "/");
                    }
                }
            }
        } catch (e2) {
        }
    }
    if (itemId.indexOf(".mp4") !== -1) {
        return "https://archive.org/download/" + itemId + "/" + itemId + ".mp4";
    }
    return "";
}

function directStreamFromText(text) {
    var t = String(text || "");
    if (!t) return "";
    var m = t.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    m = t.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    return "";
}

function execute(data) {
    data = String(data === undefined || data === null ? "" : data).trim();
    if (!data) return Response.error("Không có dữ liệu server để phát.");

    if (data.indexOf("{") === 0) {
        try {
            var payload = JSON.parse(data);
            if (payload && payload.mode === "webview" && payload.url) {
                return webviewTrack(normalizeUrl(payload.url), BASE_URL + "/");
            }
        } catch (e0) {
        }
    }

    if (/\.(m3u8|mp4)(\?|$)/i.test(data) || data.indexOf("bysezejataos.com/") !== -1) {
        return nativeTrack(data, BASE_URL + "/");
    }

    var watchUrl = data;
    var videoUrl = data;

    if (data.indexOf("/xem/") !== -1) {
        watchUrl = normalizeUrl(data);
        rateLimitDelay(siteOrigin(), 400, 1000);
        var r = pacedFetch(watchUrl, { referer: BASE_URL + "/", timeout: 30000 });
        if (!r || !r.ok || !r.res) {
            return webviewTrack(watchUrl, BASE_URL + "/");
        }
        var html = "";
        try { html = String(r.res.text() || ""); } catch (e1) { html = ""; }
        videoUrl = extractPlayerUrl(html);
        if (!videoUrl) return webviewTrack(watchUrl, BASE_URL + "/");
    }

    if (/\.(m3u8|mp4)(\?|$)/i.test(videoUrl) || videoUrl.indexOf("bysezejataos.com/") !== -1) {
        return nativeTrack(videoUrl, watchUrl);
    }

    if (videoUrl.indexOf("dailymotion.com") !== -1 || videoUrl.indexOf("dai.ly") !== -1) {
        var dmStream = resolveDailymotionM3u8(videoUrl);
        if (dmStream) return nativeTrack(dmStream, "https://www.dailymotion.com/");
    }

    if (videoUrl.indexOf("archive.org/embed/") !== -1) {
        var arStream = resolveArchiveMp4(videoUrl);
        if (arStream) return nativeTrack(arStream, "https://archive.org/");
    }

    var direct = directStreamFromText(videoUrl);
    if (direct) return nativeTrack(direct, watchUrl);

    return webviewTrack(videoUrl, watchUrl);
}
