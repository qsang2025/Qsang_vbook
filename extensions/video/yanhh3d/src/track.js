// track.js (video: buoc 2 cua chap -> track) — giai payload server cua
// YanHH3D (yanhh3d.baby) thanh doi tuong phat:
//   1. Neu input la link .m3u8/.mp4 truc tiep -> native.
//   2. Server m3u8 (data-src streamrpt1): mo trang player, lay data-obf,
//      base64-decode lay pU (playlist HLS thuong, full tap) -> native.
//      sU la playlist AES-GCM da niem phong — BO QUA, khong giai.
//   3. Server HD (play-fb-v8): mo trang JWPlayer, lay var cccc (mp4
//      fbcdn, full tap) -> native.
//   4. Neu giai khong duoc -> webview mo trang xem (player cua site).
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
    var kind = params ? String(params.kind || "") : "";

    if (!src && input.indexOf("http") === 0) {
        src = input;
        if (src.indexOf("play-fb-v8") !== -1) kind = "fb";
        else if (src.indexOf(".m3u8") !== -1) kind = "m3u8";
    }
    if (!watch) watch = BASE_URL + "/";

    if (src && kind === "m3u8") {
        var plain = resolveStreamrptPlayer(src, watch);
        if (plain && plain.stream) {
            return nativeTrack(plain.stream, plain.referer || watch);
        }
        var apiStream = resolvePhimApiFallback(watch);
        if (apiStream) {
            return nativeTrack(apiStream, "https://phimapi.com/");
        }
        return webviewTrack(watch);
    }

    if (src && kind === "fb") {
        var fb = resolveFbPlayer(src, watch);
        if (fb && fb.stream) {
            return nativeTrack(fb.stream, fb.referer || watch);
        }
        var apiStream2 = resolvePhimApiFallback(watch);
        if (apiStream2) {
            return nativeTrack(apiStream2, "https://phimapi.com/");
        }
        return webviewTrack(watch);
    }

    var apiFallback = resolvePhimApiFallback(watch);
    if (apiFallback) {
        return nativeTrack(apiFallback, "https://phimapi.com/");
    }

    if (src) {
        return webviewTrack(src);
    }

    return webviewTrack(watch);
}
