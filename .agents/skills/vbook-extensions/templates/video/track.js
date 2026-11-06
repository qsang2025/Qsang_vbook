// track.js (video: buoc 2 cua chap -> track) — giai data cua mot server
// (tu chap.js) thanh stream phat duoc (template video).
// Y tuong: template video cua Darkrai9x.
// - data da la stream truc tiep (.m3u8/.mp4) thi tra ve luon (type native).
// - data la trang embed thi boc tach link .m3u8/.mp4 trong HTML trang do.
// - Khong tach duoc thi tra type "auto" de app tu sniff stream; chi doi
//   sang "webview" neu "auto" cung khong phat duoc.
// Neu site co binh luan danmaku cho tap nay, them truong danmaku vao
// doi tuong Response.success: [{ data: url, type: "bilibili", label: "Bilibili" }].
//
// Load: build se copy config.js vao src/ (chi can BASE_URL).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function resolveEmbedToStream(embed) {
    var r = fetch(embed, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", "Referer": BASE_URL } });
    if (!r.ok) return "";
    var text = r.text();
    var m = text.match(/https?[:\\\/]+[^"'\\\s]+\.m3u8[^"'\\\s]*/i);
    if (m) return m[0].replace(/\\/g, "");
    m = text.match(/https?[:\\\/]+[^"'\\\s]+\.mp4[^"'\\\s]*/i);
    if (m) return m[0].replace(/\\/g, "");
    return "";
}

function execute(data) {
    var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: BASE_URL,
            mimeType: data.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
            headers: { "User-Agent": ua, "Referer": BASE_URL },
            timeSkip: []
        });
    }

    // Thu boc stream truc tiep tu trang embed.
    var stream = resolveEmbedToStream(data);
    if (stream) {
        return Response.success({
            type: "native",
            data: stream,
            host: BASE_URL,
            mimeType: stream.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
            headers: { "User-Agent": ua, "Referer": data },
            timeSkip: []
        });
    }

    // Khong tach duoc stream — de app tu sniff ("auto").
    return Response.success({
        type: "auto",
        data: data,
        host: BASE_URL,
        headers: { "User-Agent": ua, "Referer": BASE_URL },
        timeSkip: []
    });
}
