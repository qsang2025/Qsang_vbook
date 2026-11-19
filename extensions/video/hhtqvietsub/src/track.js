// track.js (video: buoc 2 cua chap -> track) — giai data cua mot server
// (tu chap.js) thanh stream phat duoc. Thu tu uu tien: native (.m3u8/.mp4
// truc tiep, ke ca boc tu trang embed) -> auto (trang embed / trang xem
// phim, de app tu sniff stream). Khong xoay User-Agent (quy tac 10):
// chi gui Referer, de runtime dung UA mac dinh.
// Luu y: trang embed ben thu ba co the chan IP datacenter (403 tu VM);
// viec phat that chi kiem chung duoc tren may that khi bam Play trong app.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function nativeResult(stream, referer) {
    return Response.success({
        type: "native",
        data: stream,
        host: originOf(stream),
        mimeType: stream.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
        headers: { "Referer": referer },
        timeSkip: []
    });
}

function autoResult(pageUrl) {
    return Response.success({
        type: "auto",
        data: pageUrl,
        host: originOf(pageUrl),
        headers: { "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}

// Thu boc link .m3u8/.mp4 truc tiep tu HTML trang embed. Regex la can
// thiet vi link stream nam trong script cua player, khong nam trong DOM.
// Tra ve "" neu khong boc duoc (khi do caller dung auto).
function resolveEmbedToStream(embed) {
    var r = null;
    try {
        r = pacedFetch(embed, {
            referer: BASE_URL + "/",
            timeout: 45000
        });
    } catch (e) {
        return "";
    }
    if (!r || !r.ok || !r.res) return "";
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return ""; }
    if (!text) return "";
    var m = text.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    m = text.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    return "";
}

function execute(data) {
    data = String(data || "");
    if (!data) return Response.error("Không có dữ liệu server để phát.");

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return nativeResult(data, BASE_URL + "/");
    }

    if (data.indexOf("http") !== 0) return Response.error("Không giải được link phát từ dữ liệu server.");

    // Trang xem phim cua chinh site: goi lai player de lay embed/stream.
    if (data.indexOf("/tap-") !== -1 && data.indexOf(".html") !== -1) {
        var watchUrl = normalizeUrl(data);
        rateLimitDelay(siteOrigin(), 500, 1200);
        var doc = fetchDoc(watchUrl);
        if (doc) {
            var cfg = halimCfg(doc);
            var parsed = parseSources(fetchPlayerSources(cfg, watchUrl));
            if (parsed.stream) return nativeResult(parsed.stream, watchUrl);
            if (parsed.embed) data = parsed.embed;
            else return autoResult(watchUrl);
        } else {
            return autoResult(watchUrl);
        }
    }

    // Trang embed ben thu ba: thu boc stream, khong duoc thi de app sniff.
    var stream = resolveEmbedToStream(data);
    if (stream) return nativeResult(stream, data);
    return autoResult(data);
}
