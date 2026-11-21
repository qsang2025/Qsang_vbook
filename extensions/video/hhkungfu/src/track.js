// track.js (video: buoc 2 cua chap -> track) — giai payload server cua
// HHKUNGFU (hhkungfu.ee) thanh doi tuong phat:
//   1. Neu input la link .m3u8/.mp4 truc tiep -> native.
//   2. Neu chon "Webview Trang Nguon" -> webview mo thang URL trang xem.
//   3. Goi AJAX GET /player/player.php?action=dox_ajax_player lay URL
//      iframe embed (streamfree.vip). Theo hop dong extension-api.md muc
//      Resolvers -> webview: raw HTML phai bat dau bang <html> hoac
//      <iframe (KHONG bat dau bang <!DOCTYPE html>). Dung <html><body>
//      tao iframe dong qua JS voi host la trang xem tren hhkungfu.ee de
//      giu window.self !== window.top va Referer hop le cho streamfree.vip.
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
    var ref = referer;
    if (!ref) {
        var hostLower = originOf(streamUrl).toLowerCase();
        if (hostLower.indexOf("phim1280") !== -1 || hostLower.indexOf("kkphim") !== -1 || hostLower.indexOf("kvp") !== -1) {
            ref = "https://phimapi.com/";
        } else {
            ref = BASE_URL + "/";
        }
    }
    return Response.success({
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: streamUrl.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
        headers: { "Referer": ref },
        timeSkip: []
    });
}

function createPlayerHtml(embedUrl) {
    return "<html><head>" +
        "<meta charset=\"utf-8\">" +
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no\">" +
        "<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;background:#000;overflow:hidden;}#p-wrap{width:100%;height:100%;}</style>" +
        "</head><body>" +
        "<div id=\"p-wrap\"></div>" +
        "<script>" +
        "var ifr=document.createElement(\"iframe\");" +
        "ifr.src=" + JSON.stringify(embedUrl) + ";" +
        "ifr.setAttribute(\"allowfullscreen\",\"true\");" +
        "ifr.setAttribute(\"webkitallowfullscreen\",\"true\");" +
        "ifr.setAttribute(\"mozallowfullscreen\",\"true\");" +
        "ifr.setAttribute(\"allow\",\"autoplay; fullscreen; encrypted-media\");" +
        "ifr.style.width=\"100%\";" +
        "ifr.style.height=\"100%\";" +
        "ifr.style.border=\"none\";" +
        "document.getElementById(\"p-wrap\").appendChild(ifr);" +
        "</script>" +
        "</body></html>";
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

    var fallbackUrl = (params && params.url) ? normalizeUrl(params.url) : (input.indexOf("http") === 0 ? normalizeUrl(input) : (BASE_URL + "/"));

    if (params && params.type === "web" && params.url) {
        return Response.success({
            type: "webview",
            data: fallbackUrl,
            host: siteOrigin(),
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    var playerApi = "";
    if (params && params.postId && params.chapter && params.type) {
        playerApi = BASE_URL + "/player/player.php?action=dox_ajax_player" +
            "&post_id=" + encodeURIComponent(String(params.postId)) +
            "&chapter_st=" + encodeURIComponent(String(params.chapter)) +
            "&type=" + encodeURIComponent(String(params.type)) +
            "&sv=" + encodeURIComponent(String(params.sv || "1"));
    } else if (input.indexOf("player.php") !== -1) {
        playerApi = normalizeUrl(input);
    }

    if (playerApi) {
        rateLimitDelay(siteOrigin(), 300, 800);
        var r = null;
        try {
            r = pacedFetch(playerApi, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
                referer: fallbackUrl,
                timeout: 30000
            });
        } catch (e1) {
            r = null;
        }
        if (r && r.ok && r.res) {
            var html = "";
            try { html = String(r.res.text() || ""); } catch (e2) { html = ""; }
            var m = html.match(/src="([^"]+)"/i);
            if (!m) m = html.match(/src='([^']+)'/i);
            if (m && m[1]) {
                var embed = m[1].replace(/&amp;/g, "&");
                if (embed.indexOf("//") === 0) embed = "https:" + embed;
                else if (embed.indexOf("/") === 0) embed = siteOrigin() + embed;

                if (embed.indexOf("not-found") !== -1) {
                    return Response.error("Tập này chưa có video ở server này, vui lòng chọn server khác hoặc Webview Trang Nguồn.");
                }
                if (/\.(m3u8|mp4)(\?|$)/i.test(embed)) {
                    return nativeTrack(embed, fallbackUrl);
                }
                return Response.success({
                    type: "webview",
                    data: createPlayerHtml(embed),
                    host: fallbackUrl,
                    headers: { "Referer": fallbackUrl },
                    timeSkip: []
                });
            }
        }
    }

    return Response.success({
        type: "webview",
        data: fallbackUrl,
        host: siteOrigin(),
        headers: { "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}
