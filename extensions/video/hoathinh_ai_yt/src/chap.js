// chap.js — liet ke danh sach server phat (descriptor nhe, khong giai stream som).
// Link stream that duoc track.js giai tuoi luc bam Play de tranh het han token.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function buildResolveToken(vid, startSec, endSec, durSec) {
    var tok = "resolve:" + vid;
    if (startSec > 0) tok += "|t=" + startSec;
    if (endSec > 0) tok += "|end=" + endSec;
    if (durSec > 0) tok += "|dur=" + durSec;
    return tok;
}

function buildLazyPayload(mode, vid, height, codecFam, startSec, endSec, durSec) {
    var obj = {
        mode: mode,
        vid: vid,
        startSec: startSec || 0,
        endSec: endSec || 0,
        durSec: durSec || 0
    };
    if (height) obj.height = height;
    if (codecFam) obj.codecFam = codecFam;
    return JSON.stringify(obj);
}

function resolveTracks(vid, startSec, endSec, durSec) {
    var pref = getPreferredQuality();
    var audioMode = getAudioOnlyMode();
    var servers = [];
    var watchUrl = BASE_URL + "/watch?v=" + vid + (startSec > 0 ? "&t=" + startSec + "s" : "");

    var sAuto = {
        title: "Tự động giải mã (Theo cài đặt)",
        data: buildResolveToken(vid, startSec, endSec, durSec)
    };
    var s1080 = {
        title: "MP4 1080p (HD - H.264)",
        data: buildLazyPayload("lazy", vid, 1080, "avc1", startSec, endSec, durSec)
    };
    var s720 = {
        title: "MP4 720p (HD - H.264)",
        data: buildLazyPayload("lazy", vid, 720, "avc1", startSec, endSec, durSec)
    };
    var s4k2k = {
        title: "4K / 2K Ultra HD (AV1)",
        data: buildLazyPayload("lazy", vid, 2160, "av01", startSec, endSec, durSec)
    };
    var s1080Av1 = {
        title: "MP4 1080p AV1 (HD)",
        data: buildLazyPayload("lazy", vid, 1080, "av01", startSec, endSec, durSec)
    };
    var s360 = {
        title: "MP4 360p (Nhanh / Tiết kiệm)",
        data: buildLazyPayload("lazy_mp4", vid, 360, "", startSec, endSec, durSec)
    };
    var sAudio = {
        title: "Audio Thuyết Minh (Tiết kiệm Data)",
        data: buildLazyPayload("lazy_audio", vid, 0, "", startSec, endSec, durSec)
    };
    var sWeb = {
        title: "Webview YouTube",
        data: JSON.stringify({ mode: "webview", url: watchUrl, vid: vid })
    };

    if (audioMode === "audio_stream") {
        servers = [sAudio, s360, sAuto, s720, s1080, s4k2k, s1080Av1, sWeb];
    } else if (audioMode === "data_saver_360p") {
        servers = [s360, sAuto, s720, s1080, s4k2k, s1080Av1, sAudio, sWeb];
    } else if (pref === "4k_2k") {
        servers = [s4k2k, s1080, s720, s1080Av1, s360, sAuto, sAudio, sWeb];
    } else if (pref === "720p") {
        servers = [s720, s1080, s360, s4k2k, s1080Av1, sAuto, sAudio, sWeb];
    } else {
        servers = [s1080, s720, s4k2k, s1080Av1, s360, sAuto, sAudio, sWeb];
    }
    return servers;
}

function execute(url) {
    var raw = String(url || "").trim();
    if (/\.m3u8(\?|$)/i.test(raw) && raw.indexOf("http") === 0) {
        return Response.success([{ title: "PhimAPI Native HLS", data: raw }]);
    }
    url = normYtUrl(raw);
    var vid = extractVideoId(url);
    if (!vid) return Response.error("Không đọc được ID video YouTube từ URL: " + url);
    var startSec = extractStartSec(url);
    var endSec = extractEndSec(url);
    var durSec = extractDurSec(url);

    return Response.success(resolveTracks(vid, startSec, endSec, durSec));
}
