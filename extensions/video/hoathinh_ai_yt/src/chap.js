// chap.js — giai danh sach stream (Native HLS + Muxed MP4 + Adaptive HD MP4 + Re-resolve).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function collectInnerTubeStreams(data, hlsList, mp4List, hdList) {
    if (!data || !data.streamingData) return;
    var sd = data.streamingData;
    if (sd.hlsManifestUrl) {
        hlsList.push(String(sd.hlsManifestUrl));
    }
    var formats = sd.formats || [];
    var i = 0;
    for (i = 0; i < formats.length; i++) {
        var f = formats[i];
        if (f && f.url && f.mimeType && String(f.mimeType).indexOf("video/mp4") !== -1) {
            mp4List.push({
                url: String(f.url),
                height: parseInt(f.height || 0, 10) || 0,
                label: f.qualityLabel ? String(f.qualityLabel) : (f.height ? f.height + "p" : "MP4")
            });
        }
    }

    var adaptive = sd.adaptiveFormats || [];
    var bestAudio = "";
    for (i = 0; i < adaptive.length; i++) {
        var af = adaptive[i];
        if (af && af.url && af.mimeType && String(af.mimeType).indexOf("audio/mp4") !== -1) {
            if (!bestAudio || parseInt(af.itag || 0, 10) === 140) {
                bestAudio = String(af.url);
                if (parseInt(af.itag || 0, 10) === 140) break;
            }
        }
    }
    if (bestAudio) {
        var seenH = {};
        for (i = 0; i < adaptive.length; i++) {
            var vf = adaptive[i];
            if (vf && vf.url && vf.mimeType && String(vf.mimeType).indexOf("video/mp4") !== -1) {
                var h = parseInt(vf.height || 0, 10) || 0;
                if (h >= 720 && !seenH[h]) {
                    seenH[h] = true;
                    hdList.push({
                        v: String(vf.url),
                        a: bestAudio,
                        height: h,
                        label: vf.qualityLabel ? String(vf.qualityLabel) : (h + "p")
                    });
                }
            }
        }
    }
}

function collectPipedStreams(data, hlsList, mp4List) {
    if (!data) return;
    if (data.hls) hlsList.push(String(data.hls));
    var vs = data.videoStreams || [];
    var i = 0;
    for (i = 0; i < vs.length; i++) {
        var s = vs[i];
        if (s && s.url && s.videoOnly === false) {
            mp4List.push({
                url: String(s.url),
                height: parseInt(s.height || 0, 10) || 0,
                label: s.quality ? String(s.quality) : "MP4"
            });
        }
    }
}

function collectInvidiousStreams(data, hlsList, mp4List) {
    if (!data) return;
    if (data.hlsUrl) hlsList.push(String(data.hlsUrl));
    var fs = data.formatStreams || [];
    var i = 0;
    for (i = 0; i < fs.length; i++) {
        var f = fs[i];
        if (f && f.url && f.container === "mp4") {
            mp4List.push({
                url: String(f.url),
                height: parseInt(String(f.resolution || "").replace(/[^0-9]/g, ""), 10) || 0,
                label: f.qualityLabel ? String(f.qualityLabel) : "MP4"
            });
        }
    }
}

function resolveTracks(vid) {
    var hlsList = [];
    var mp4List = [];
    var hdList = [];
    var clients = ["ANDROID", "IOS", "ANDROID_VR"];
    var i = 0;

    for (i = 0; i < clients.length; i++) {
        var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
        if (itData && itData.streamingData) {
            collectInnerTubeStreams(itData, hlsList, mp4List, hdList);
            if (hlsList.length > 0 || mp4List.length > 0 || hdList.length > 0) break;
        }
    }

    if (hlsList.length === 0 && mp4List.length === 0 && hdList.length === 0) {
        var apiRes = requestApi("/streams/" + vid, { timeoutMs: 5000 });
        if (apiRes) {
            if (apiRes.tier === "piped") collectPipedStreams(apiRes.data, hlsList, mp4List);
            else if (apiRes.tier === "invidious") collectInvidiousStreams(apiRes.data, hlsList, mp4List);
        }
    }

    mp4List.sort(function (a, b) { return b.height - a.height; });
    hdList.sort(function (a, b) { return b.height - a.height; });

    var servers = [];
    var seenUrl = {};
    for (i = 0; i < hlsList.length; i++) {
        if (hlsList[i] && !seenUrl[hlsList[i]]) {
            seenUrl[hlsList[i]] = true;
            servers.push({
                title: "Native HLS (.m3u8)",
                data: "hls|" + hlsList[i]
            });
        }
    }
    for (i = 0; i < mp4List.length; i++) {
        if (mp4List[i].url && !seenUrl[mp4List[i].url]) {
            seenUrl[mp4List[i].url] = true;
            servers.push({
                title: "MP4 " + mp4List[i].label,
                data: "mp4|" + mp4List[i].url
            });
        }
    }
    for (i = 0; i < hdList.length; i++) {
        if (hdList[i].v && !seenUrl[hdList[i].v]) {
            seenUrl[hdList[i].v] = true;
            servers.push({
                title: "MP4 " + hdList[i].label + " (HD)",
                data: "av|" + JSON.stringify({ v: hdList[i].v, a: hdList[i].a })
            });
        }
    }
    servers.push({
        title: "Tự động giải mã (Re-resolve)",
        data: "resolve:" + vid
    });
    return servers;
}

function execute(url) {
    url = normYtUrl(url);
    var vid = extractVideoId(url);
    if (!vid) return Response.error("Không đọc được ID video YouTube từ URL: " + url);

    return Response.success(resolveTracks(vid));
}
