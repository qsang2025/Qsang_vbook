// track.js — tra ve payload phat native (.m3u8 / .mp4) hoac lazy re-resolve.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : BASE_URL;
}

function buildNativeTrack(streamUrl, mimeType, audioUrl) {
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    var out = {
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: mimeType,
        headers: hdrs,
        timeSkip: []
    };
    if (audioUrl) {
        out.audios = [{
            title: "Audio",
            data: audioUrl,
            headers: hdrs
        }];
    }
    return Response.success(out);
}

function resolveLazy(vid) {
    var clients = ["ANDROID", "IOS", "ANDROID_VR"];
    var i = 0;
    for (i = 0; i < clients.length; i++) {
        var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
        if (itData && itData.streamingData) {
            if (itData.streamingData.hlsManifestUrl) {
                return buildNativeTrack(String(itData.streamingData.hlsManifestUrl), "application/x-mpegURL", "");
            }
            var formats = itData.streamingData.formats || [];
            var best = null;
            var j = 0;
            for (j = 0; j < formats.length; j++) {
                var f = formats[j];
                if (f && f.url && f.mimeType && String(f.mimeType).indexOf("video/mp4") !== -1) {
                    if (!best || (parseInt(f.height || 0, 10) > parseInt(best.height || 0, 10))) {
                        best = f;
                    }
                }
            }
            if (best && best.url) return buildNativeTrack(String(best.url), "video/mp4", "");

            var adaptive = itData.streamingData.adaptiveFormats || [];
            var bestV = null;
            var bestA = "";
            for (j = 0; j < adaptive.length; j++) {
                var af = adaptive[j];
                if (!af || !af.url || !af.mimeType) continue;
                var mt = String(af.mimeType);
                if (mt.indexOf("audio/mp4") !== -1) {
                    if (!bestA || parseInt(af.itag || 0, 10) === 140) bestA = String(af.url);
                } else if (mt.indexOf("video/mp4") !== -1) {
                    if (!bestV || parseInt(af.height || 0, 10) > parseInt(bestV.height || 0, 10)) bestV = af;
                }
            }
            if (bestV && bestV.url) return buildNativeTrack(String(bestV.url), "video/mp4", bestA);
        }
    }

    var apiRes = requestApi("/streams/" + vid, { timeoutMs: 6000 });
    if (apiRes && apiRes.data) {
        var d = apiRes.data;
        if (d.hls) return buildNativeTrack(String(d.hls), "application/x-mpegURL", "");
        if (d.hlsUrl) return buildNativeTrack(String(d.hlsUrl), "application/x-mpegURL", "");
        var vs = d.videoStreams || d.formatStreams || [];
        var bestAlt = null;
        for (i = 0; i < vs.length; i++) {
            var s = vs[i];
            if (s && s.url && (s.videoOnly === false || s.container === "mp4")) {
                if (!bestAlt) bestAlt = s;
            }
        }
        if (bestAlt && bestAlt.url) return buildNativeTrack(String(bestAlt.url), "video/mp4", "");
    }

    return Response.error("Không giải mã được stream YouTube (có thể IP bị chặn bot): " + vid);
}

function execute(data) {
    var s = String(data || "").trim();
    if (!s) return Response.error("Thiếu dữ liệu track");

    if (s.indexOf("hls|") === 0) {
        return buildNativeTrack(s.substring(4), "application/x-mpegURL", "");
    }
    if (s.indexOf("mp4|") === 0) {
        return buildNativeTrack(s.substring(4), "video/mp4", "");
    }
    if (s.indexOf("av|") === 0) {
        try {
            var av = JSON.parse(s.substring(3));
            if (av && av.v) return buildNativeTrack(String(av.v), "video/mp4", av.a ? String(av.a) : "");
        } catch (e) {}
    }
    if (s.indexOf("resolve:") === 0) {
        var vid = extractVideoId(s.substring(8));
        if (!vid) return Response.error("ID video không hợp lệ: " + s);
        return resolveLazy(vid);
    }

    var directVid = extractVideoId(s);
    if (directVid) return resolveLazy(directVid);

    if (s.indexOf("http") === 0) {
        var mime = s.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4";
        return buildNativeTrack(s, mime, "");
    }

    return Response.error("Định dạng track không hỗ trợ: " + s);
}
