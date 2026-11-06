// track.js (audio: buoc 2 cua chap -> track) — giai handle nguon cua
// chap.js thanh URL audio phat duoc (template audio).
// Y tuong: template audio cua Darkrai9x.
// Trinh phat audio doc track theo thu tu: audios[0].data + audios[0].headers
// (uu tien khi co), roi moi den data + headers. Mot doi tuong don
// { type, data, headers } la du; audios chi can khi site co nhieu chat
// luong/bitrate — muc nao phat thi dat len dau.
// Audio KHONG co duong fallback "auto"/"webview" nhu video: trinh phat can
// mot URL media that (.mp3/.m4a/.aac/.flac/.m3u8). Khong tach duoc thi tra
// Response.error de loi hien ro, thay vi im lang khong phat.
// Loi bai hat nam o truong lyrics — KHONG phai subtitles (trinh phat audio
// khong doc subtitles). Moi muc lyrics.data co the la URL, data URI, hoac
// text tho; LRC ([mm:ss.xx]) cho highlight + tu cuon dong bo, text thuong
// chi hien khong dong bo. Chi muc dau tien duoc dung.
//
// Load: build se copy config.js vao src/ (chi can BASE_URL).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function resolveDirectAudio(pageUrl) {
    var r = fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", "Referer": BASE_URL } });
    if (!r.ok) return "";
    var text = r.text();
    var m = text.match(/https?[:\\\/]+[^"'\\\s]+\.(?:mp3|m4a|aac|flac|ogg|opus)[^"'\\\s]*/i);
    if (m) return m[0].replace(/\\/g, "");
    m = text.match(/https?[:\\\/]+[^"'\\\s]+\.m3u8[^"'\\\s]*/i);
    if (m) return m[0].replace(/\\/g, "");
    return "";
}

// Tra ve [] khi site khong co loi — khong bao gio tra placeholder gia tao.
function resolveLyrics(pageUrl) {
    var r = fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", "Referer": BASE_URL } });
    if (!r.ok) return [];

    // Uu tien: file .lrc that, de hien highlight + tu cuon dong bo.
    var m = r.text().match(/https?[:\\\/]+[^"'\\\s]+\.lrc[^"'\\\s]*/i);
    if (m) return [{ data: m[0].replace(/\\/g, ""), type: "lrc" }];

    // Fallback: loi hien ngay trong trang — gui text tho.
    var node = r.html().select("SELECTOR_LYRICS_NODE").first();
    if (node) {
        var text = node.html().replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
        if (text) return [{ data: text, type: "txt" }];
    }
    return [];
}

function execute(data) {
    var url = data;
    if (!/\.(?:mp3|m4a|aac|flac|ogg|opus|m3u8)(?:[?#]|$)/i.test(data)) {
        url = resolveDirectAudio(data);
    }
    if (!url) return Response.error("Không lấy được link audio");

    return Response.success({
        type: "native",
        data: url,
        host: BASE_URL,
        mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "audio/mpeg",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", "Referer": BASE_URL },
        // Chi khi site co nhieu chat luong — muc dau tien thang.
        audios: [],
        lyrics: resolveLyrics(data)
    });
}
