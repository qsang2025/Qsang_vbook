// track.js (video: buoc 2 cua chap -> track) — giai payload cua chap.js (hoac URL
// /player/<series_id>/<item_id> truc tiep) thanh luong MP4 native khong ma hoa.
// Thu tu giai:
//   - Che do "hd": POST /api/video/protected/play-info (720p) -> dung legacy_play_info.main_url
//     neu la MP4 khong ma hoa (er=0, dung cho man kich & hoat hinh AI); nguoc lai tu dong
//     chuyen sang POST /api/video/protected/fallback-play-info (MP4 muxed er=0 cho phim ngan).
//   - Che do "fallback": goi thang /api/video/protected/fallback-play-info.
//   - Tap 6+ bi chan HTTP 403 -> tra Response.error tieng Viet ro rang.
// Header gui kem cho CDN qznovelvod.com: Referer: https://hongguoduanju.com/ (khong xoay UA).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function parseTrackPayload(raw) {
    var text = String(raw || "").replace(/^\s+|\s+$/g, "");
    if (!text) return { seriesId: "", itemId: "", mode: "hd" };

    if (text.charAt(0) === "{") {
        try {
            var obj = JSON.parse(text);
            return {
                seriesId: String(obj.seriesId || obj.series_id || ""),
                itemId: String(obj.itemId || obj.item_id || obj.vid || ""),
                mode: String(obj.mode || "hd")
            };
        } catch (e) {
            return { seriesId: "", itemId: "", mode: "hd" };
        }
    }

    var ids = extractPlayerIds(text);
    return {
        seriesId: ids.seriesId,
        itemId: ids.itemId,
        mode: "hd"
    };
}

function execute(data) {
    var payload = parseTrackPayload(data);
    if (!payload.itemId) {
        return Response.error("Không đọc được mã tập phim từ dữ liệu luồng phát.");
    }

    var resolved = resolveStreamUrl(payload.seriesId, payload.itemId, payload.mode);
    if (!resolved.ok || !resolved.url) {
        return Response.error(resolved.error || "Không giải được link phát MP4 trực tiếp cho tập này.");
    }

    return Response.success({
        type: "native",
        data: resolved.url,
        host: originOf(resolved.url),
        mimeType: "video/mp4",
        headers: {
            "Referer": videoBaseUrl() + "/"
        },
        timeSkip: []
    });
}
