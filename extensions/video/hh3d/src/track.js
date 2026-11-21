// track.js (video: buoc 2 cua chap -> track) — trich xuat truc tiep
// URL .m3u8 trong HTML trang tap phim HH3D (hh3d.ad), kem fallback
// PhimAPI (https://phimapi.com/phim/<slug>) va cuoi cung webview.
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
    var res = fetchPage(watchUrl, { referer: BASE_URL + "/" });
    if (res && !res.browser) {
        var html = "";
        try { html = String(res.text() || ""); } catch (e1) { html = ""; }
        if (html) {
            var m = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
            if (m && m[0]) {
                return nativeTrack(m[0].replace(/\\\//g, "/"), BASE_URL + "/");
            }
        }
    }

    var apiStream = resolvePhimApiFallback(watchUrl);
    if (apiStream) {
        return nativeTrack(apiStream, "https://phimapi.com/");
    }

    return webviewTrack(watchUrl);
}
