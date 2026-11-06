load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
// track.js (video: buoc 2 cua chuoi chap -> track) — HHKUNGFU.
// `data` la URL AJAX player.php (tu chap.js). Goi no de lay <iframe>
// embed (streamfree.vip). Neu embed chua link .m3u8/.mp4 truc tiep thi
// tra ve native; khong thi tra ve "auto" de app tu bat stream tu trang
// embed. Tap chua co video tra ve iframe not-found.jpg -> bao loi ro
// rang de nguoi dung doi server khac thay vi mo trang anh loi.
function resolveEmbedToStream(embed) {
    var r = fetchWithFallback(embed, { headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL } });
    if (!r.ok) return "";
    var text = r.text();
    var m = text.match(/https?[:\\\/]+[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
    if (m) return m[0].replace(/\\/g, "");
    m = text.match(/https?[:\\\/]+[^"'\s\\]+\.mp4[^"'\s\\]*/i);
    if (m) return m[0].replace(/\\/g, "");
    return "";
}

function execute(data) {
    data = String(data === undefined || data === null ? "" : data);
    if (!data) return Response.error("Thiếu đường dẫn video");

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: siteOrigin(),
            mimeType: data.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
            headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL },
            timeSkip: []
        });
    }

    // Goi player.php de lay iframe embed.
    var embed = "";
    if (data.indexOf("player.php") !== -1) {
        var r = fetchWithFallback(data, { headers: { "Referer": BASE_URL } });
        if (!r.ok) return Response.error("Không lấy được link xem (HTTP " + r.status + ")");
        var html = r.text();
        var m = html.match(/<iframe[^>]+src="([^"]+)"/i);
        if (m) embed = m[1];
        if (!embed) return Response.error("Server chưa trả về link xem, thử lại sau");
        if (embed.indexOf("not-found") !== -1) {
            return Response.error("Tập này chưa có video ở server này, thử server khác");
        }
    } else {
        embed = data;
    }

    // Thu lay stream truc tiep tu trang embed.
    var stream = resolveEmbedToStream(embed);
    if (stream) {
        return Response.success({
            type: "native",
            data: stream,
            host: siteOrigin(),
            mimeType: stream.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
            headers: { "User-Agent": UserAgent.chrome(), "Referer": embed },
            timeSkip: []
        });
    }

    // streamfree.vip ma hoa chunk va giai ma bang WASM/WebWorker,
    // bat buoc chay trong iframe (window.top !== window.self) voi Referer site nguon.
    // Resolver "auto" (headless sniff) bi chan va bao loi "Khong the tai may chu nay".
    // Chuyen sang "webview" va boc embed vao HTML iframe container de player JWPlayer
    // phat muot ma trong webview cua app.
    var playerHtml = '<!DOCTYPE html><html><head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">' +
        '<style>* { margin:0; padding:0; box-sizing:border-box; } html,body { width:100%; height:100%; background:#000; overflow:hidden; } iframe { width:100%; height:100%; border:none; display:block; }</style>' +
        '</head><body>' +
        '<iframe src="' + embed + '" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" allow="autoplay; fullscreen; encrypted-media"></iframe>' +
        '</body></html>';

    return Response.success({
        type: "webview",
        data: playerHtml,
        host: siteOrigin(),
        headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}
