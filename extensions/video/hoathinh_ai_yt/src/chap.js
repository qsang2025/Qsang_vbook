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
    var bestAudioObj = null;
    for (i = 0; i < adaptive.length; i++) {
        var af = adaptive[i];
        if (!af || !af.url || !af.mimeType || !af.initRange || !af.indexRange) continue;
        var amt = String(af.mimeType);
        if (amt.indexOf("audio/mp4") !== -1) {
            var isItag140 = parseInt(af.itag || 0, 10) === 140;
            var isOrig140 = isItag140 && !af.isDrc;
            if (!bestAudioObj || isOrig140 || (isItag140 && parseInt(bestAudioObj.itag || 0, 10) !== 140)) {
                bestAudioObj = af;
                if (isOrig140) break;
            }
        }
    }
    if (bestAudioObj) {
        var byKey = {};
        var keys = [];
        for (i = 0; i < adaptive.length; i++) {
            var vf = adaptive[i];
            if (!vf || !vf.url || !vf.mimeType || !vf.initRange || !vf.indexRange) continue;
            var vmt = String(vf.mimeType);
            if (vmt.indexOf("video/mp4") === -1) continue;
            var h = getFormatQualityHeight(vf);
            if (h < 720) continue;
            var codecFam = getVideoCodecFamily(vf) || "mp4";
            var key = h + "_" + codecFam;
            if (!byKey[key]) {
                keys.push(key);
                byKey[key] = {
                    v: String(vf.url),
                    a: String(bestAudioObj.url),
                    vInit: String(vf.initRange.start) + "-" + String(vf.initRange.end),
                    vIndex: String(vf.indexRange.start) + "-" + String(vf.indexRange.end),
                    aInit: String(bestAudioObj.initRange.start) + "-" + String(bestAudioObj.initRange.end),
                    aIndex: String(bestAudioObj.indexRange.start) + "-" + String(bestAudioObj.indexRange.end),
                    height: h,
                    codecFam: codecFam,
                    isAv1Bonus: (codecFam === "av01" && (h === 1080 || h === 720)),
                    mimeType: "video/mp4",
                    label: vf.qualityLabel ? String(vf.qualityLabel) : (h + "p")
                };
            }
        }
        for (i = 0; i < keys.length; i++) {
            hdList.push(byKey[keys[i]]);
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

function formatHdTitle(hdItem) {
    var h = hdItem.height || 0;
    var lbl = hdItem.label || (h + "p");
    if (h >= 2160) {
        return lbl.indexOf("4K") === -1 ? ("4K " + lbl + " (HD)") : (lbl + " (HD)");
    }
    if (h >= 1440 && h < 2160) {
        return lbl.indexOf("2K") === -1 ? ("2K " + lbl + " (HD)") : (lbl + " (HD)");
    }
    if (hdItem.isAv1Bonus) {
        return "MP4 " + h + "p AV1 (HD)";
    }
    return "MP4 " + lbl + " (HD)";
}

function buildResolveToken(vid, startSec, endSec, durSec) {
    var tok = "resolve:" + vid;
    if (startSec > 0) tok += "|t=" + startSec;
    if (endSec > 0) tok += "|end=" + endSec;
    if (durSec > 0) tok += "|dur=" + durSec;
    return tok;
}

function orderServersByQuality(hlsServers, videoServers, pref) {
    var ordered = [];
    var used = {};
    var i = 0;

    function pushList(list) {
        var idx = 0;
        for (idx = 0; idx < list.length; idx++) {
            if (!used[list[idx].title]) {
                used[list[idx].title] = true;
                ordered.push({ title: list[idx].title, data: list[idx].data });
            }
        }
    }

    function filterByHeight(minH, maxH, preferH264Only) {
        var matched = [];
        var idx = 0;
        for (idx = 0; idx < videoServers.length; idx++) {
            var h = videoServers[idx].height || 0;
            if (h >= minH && h <= maxH) {
                if (preferH264Only && videoServers[idx].isAv1Bonus) continue;
                matched.push(videoServers[idx]);
            }
        }
        return matched;
    }

    if (pref === "auto_hls") {
        pushList(hlsServers);
        pushList(videoServers);
    } else if (pref === "4k_2k") {
        pushList(filterByHeight(2160, 99999, false));
        pushList(filterByHeight(1440, 2159, false));
        pushList(hlsServers);
        pushList(videoServers);
    } else if (pref === "720p") {
        pushList(filterByHeight(720, 720, true));
        pushList(filterByHeight(720, 720, false));
        pushList(hlsServers);
        pushList(videoServers);
    } else {
        // Default "1080p"
        pushList(filterByHeight(1080, 1080, true));
        pushList(filterByHeight(1080, 1080, false));
        pushList(hlsServers);
        pushList(videoServers);
    }
    return ordered;
}

function resolveTracks(vid, startSec, endSec, durSec) {
    var hlsList = [];
    var mp4List = [];
    var hdList = [];
    var subtitles = [];
    var audios = [];
    var clients = getPlayerClientsOrder();
    var i = 0;

    var totalDur = durSec || 0;
    for (i = 0; i < clients.length; i++) {
        var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
        if (itData && itData.streamingData) {
            if (!totalDur && itData.videoDetails && itData.videoDetails.lengthSeconds) {
                totalDur = parseDurationSec(itData.videoDetails.lengthSeconds);
            }
            collectInnerTubeStreams(itData, hlsList, mp4List, hdList);
            if (subtitles.length === 0) {
                subtitles = extractInnerTubeSubtitles(itData);
            }
            if (audios.length === 0 && itData.streamingData.adaptiveFormats) {
                audios = extractInnerTubeAudios(itData.streamingData.adaptiveFormats, {
                    "Referer": BASE_URL + "/",
                    "Origin": BASE_URL
                });
            }
            if (hlsList.length > 0 || mp4List.length > 0 || hdList.length > 0) {
                setPreferredPlayerClient(clients[i]);
                break;
            }
        }
    }

    if (hlsList.length === 0 && mp4List.length === 0 && hdList.length === 0) {
        var apiRes = requestApi("/streams/" + vid, { timeoutMs: 5000 });
        if (apiRes) {
            if (apiRes.tier === "piped") {
                collectPipedStreams(apiRes.data, hlsList, mp4List);
                if (subtitles.length === 0) subtitles = extractPipedSubtitles(apiRes.data);
            } else if (apiRes.tier === "invidious") {
                collectInvidiousStreams(apiRes.data, hlsList, mp4List);
            }
        }
    }

    mp4List.sort(function (a, b) { return b.height - a.height; });
    hdList.sort(function (a, b) { return b.height - a.height; });

    var hlsServers = [];
    var videoServers = [];
    var seenUrl = {};
    for (i = 0; i < hlsList.length; i++) {
        if (hlsList[i] && !seenUrl[hlsList[i]]) {
            seenUrl[hlsList[i]] = true;
            hlsServers.push({
                title: "Native HLS (.m3u8)",
                height: 0,
                data: JSON.stringify({
                    mode: "hls",
                    url: hlsList[i],
                    vid: vid,
                    startSec: startSec || 0,
                    endSec: endSec || 0,
                    durSec: durSec || 0,
                    subtitles: subtitles,
                    audios: audios
                })
            });
        }
    }
    for (i = 0; i < hdList.length; i++) {
        if (hdList[i].v && !seenUrl[hdList[i].v]) {
            seenUrl[hdList[i].v] = true;
            videoServers.push({
                title: formatHdTitle(hdList[i]),
                height: hdList[i].height || 0,
                codecFam: hdList[i].codecFam || "",
                isAv1Bonus: !!hdList[i].isAv1Bonus,
                data: JSON.stringify({
                    mode: "av",
                    v: hdList[i].v,
                    a: hdList[i].a,
                    vInit: hdList[i].vInit,
                    vIndex: hdList[i].vIndex,
                    aInit: hdList[i].aInit,
                    aIndex: hdList[i].aIndex,
                    height: hdList[i].height || 0,
                    codecFam: hdList[i].codecFam || "",
                    mimeType: hdList[i].mimeType || "video/mp4",
                    vid: vid,
                    startSec: startSec || 0,
                    endSec: endSec || 0,
                    durSec: durSec || 0,
                    subtitles: subtitles,
                    audios: audios
                })
            });
        }
    }
    for (i = 0; i < mp4List.length; i++) {
        if (mp4List[i].url && !seenUrl[mp4List[i].url]) {
            seenUrl[mp4List[i].url] = true;
            videoServers.push({
                title: "MP4 " + mp4List[i].label,
                height: mp4List[i].height || 0,
                data: JSON.stringify({
                    mode: "mp4",
                    url: mp4List[i].url,
                    vid: vid,
                    startSec: startSec || 0,
                    endSec: endSec || 0,
                    durSec: durSec || 0,
                    subtitles: subtitles,
                    audios: audios
                })
            });
        }
    }

    videoServers.sort(function (a, b) {
        if (b.height !== a.height) return b.height - a.height;
        return (a.isAv1Bonus ? 1 : 0) - (b.isAv1Bonus ? 1 : 0);
    });
    var servers = orderServersByQuality(hlsServers, videoServers, getPreferredQuality());

    if (hdList.length > 0 && hdList[0].a && hdList[0].aInit && hdList[0].aIndex) {
        var audioTrackItem = {
            title: "Audio Thuyết Minh (Tiết kiệm Data)",
            data: JSON.stringify({
                mode: "audio_only",
                a: hdList[0].a,
                aInit: hdList[0].aInit,
                aIndex: hdList[0].aIndex,
                vid: vid,
                startSec: startSec || 0,
                endSec: endSec || 0,
                durSec: durSec || 0,
                subtitles: subtitles
            })
        };
        var audioMode = getAudioOnlyMode();
        if (audioMode === "audio_stream") {
            servers.unshift(audioTrackItem);
        } else {
            servers.push(audioTrackItem);
        }
    }

    if (getAudioOnlyMode() === "data_saver_360p") {
        var sIdx = 0;
        for (sIdx = 0; sIdx < servers.length; sIdx++) {
            if (servers[sIdx].title.indexOf("360p") !== -1) {
                var picked = servers.splice(sIdx, 1)[0];
                servers.unshift(picked);
                break;
            }
        }
    }

    servers.push({
        title: "Tự động giải mã (Re-resolve)",
        data: buildResolveToken(vid, startSec, endSec, totalDur || durSec)
    });
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
    recordWatchedVideo(vid, "", "", "");
    var startSec = extractStartSec(url);
    var endSec = extractEndSec(url);
    var durSec = extractDurSec(url);

    return Response.success(resolveTracks(vid, startSec, endSec, durSec));
}
