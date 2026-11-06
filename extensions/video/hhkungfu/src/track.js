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

    // Khong boc duoc stream truc tiep — de app tu bat stream ("auto").
    // Chi doi sang "webview" neu "auto" khong xem duoc embed nay.
    return Response.success({
        type: "auto",
        data: embed,
        host: siteOrigin(),
        headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL },
        timeSkip: []
    });
}
