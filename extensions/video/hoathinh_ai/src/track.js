// track.js (video: buoc 2 cua chap -> track) — giai video id cua
// Dailymotion thanh stream phat duoc.
// GET https://www.dailymotion.com/player/metadata/video/<id>
//     -> .qualities.auto[0].url la link .m3u8 goc cua CDN
//     (vd https://cdndirector.dailymotion.com/cdn/manifest/video/x98x90i.m3u8?...)
// (da kiem chung 2026-11-06: metadata tra 200, co auto[0].url).
// Tra ve type "native" + mimeType HLS + Referer la goc Dailymotion.
// host lay tu origin cua chinh URL stream that (vd.
// https://cdndirector.dailymotion.com), khong phai domain xem video —
// stream nam tren CDN khac; Referer van la domain nguon BASE_URL + "/".
// KHONG dung streamfree.vip, khong xoay User-Agent (AGENTS.md §6 quy
// tac 10) — chi gui Referer, de runtime dung UA mac dinh.
//
// LUU Y: tu VM nay, fetch truc tiep playlist .m3u8 do tra HTTP 403
// (nhieu kha nang CDN chan IP datacenter, giong truong hop apptruyenchu
// 403 tren GitHub runner 2026-11-06). Viec phat that chi kiem chung duoc
// khi user bam Play tren app (ExoPlayer chay tren IP cua may).
//
// Load: build se copy config.js, config-helpers.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

// Origin cua URL (vd. "https://cdndirector.dailymotion.com") — dung lam
// host de app gan cookie/Referer theo dung host phat stream. Fallback ve
// BASE_URL neu khong tach duoc origin (mau hoathinh3d).
function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : BASE_URL;
}

function execute(data) {
    var id = videoIdFromUrl(data);
    if (!id) return Response.error("Không đọc được id video: " + data);

    var meta = dmApiGet(META_BASE + "/player/metadata/video/" + id);
    if (!meta) return Response.error("Không tải được thông tin phát video (Dailymotion): " + id);

    var m3u8 = extractM3u8(meta);
    if (!m3u8) return Response.error("Không tìm thấy link phát .m3u8 cho video: " + id);

    return Response.success({
        type: "native",
        data: m3u8,
        host: originOf(m3u8),
        mimeType: "application/x-mpegURL",
        headers: { "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}
