// track.js (video: buoc 2 cua chap -> track) — giai payload server cua
// HH3D (hh3d.ad) thanh doi tuong phat:
//   1. Neu input la link .m3u8/.mp4 truc tiep -> native.
//   2. Server m3u8: mo lai trang xem, trich var all_sources moi nhat
//      (link CDN het han nhanh nen khong dung link cu trong chap) -> native.
//      Neu mo trang that bai thi dung link src trong payload.
//   3. Neu giai khong duoc -> webview mo trang xem (player cua site).
// KHONG BAO GIO tra type "auto".
// Nap: file config.js, file config-helpers.js, file fetch-helpers.js,
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

function freshSources(watchUrl) {
    try {
        rateLimitDelay(siteOrigin(), 400, 1000);
        var doc = fetchDocWithFallback(watchUrl, MIRROR_LIST);
        if (!doc) return [];
        var html = "";
        try { html = String(doc.html() || ""); } catch (e) { html = ""; }
        return parseAllSources(html);
    } catch (e2) {
        return [];
    }
}

function execute(input) {
    input = String(input === undefined || input === null ? "" : input).trim();
    if (!input) return Response.error("Không có dữ liệu server để phát.");

    if (/\.(m3u8|mp4)(\?|$)/i.test(input)) {
        return nativeTrack(input, "");
    }

    var params = null;
    if (input.indexOf("{") === 0) {
        try {
            params = JSON.parse(input);
        } catch (e0) {
            params = null;
        }
    }

    if (params && params.type === "native" && params.stream) {
        return nativeTrack(String(params.stream), params.referer || "");
    }

    if (params && params.type === "web" && params.url) {
        return webviewTrack(String(params.url));
    }

    var src = params ? String(params.src || "") : "";
    var watch = params ? String(params.watch || "") : "";
    var index = params ? parseInt(params.index, 10) : 0;
    if (isNaN(index) || index < 0) index = 0;

    if (!src && input.indexOf("http") === 0) {
        src = input;
    }
    if (!watch) watch = BASE_URL + "/";

    if (src) {
        var fresh = [];
        if (watch !== BASE_URL + "/") {
            fresh = freshSources(watch);
        }
        var stream = "";
        if (fresh.length > 0) {
            stream = fresh[index] || fresh[0];
        } else {
            stream = src;
        }
        if (stream) {
            return nativeTrack(stream, watch);
        }
        return webviewTrack(watch);
    }

    return webviewTrack(watch);
}
