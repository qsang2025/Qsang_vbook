// track.js — tra ve payload phat native (.m3u8 / .mp4), subtitles, multi-audio, SponsorBlock & timestamp skip.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : BASE_URL;
}

function fetchSponsorBlockSkips(vid) {
    var skips = [];
    if (!vid) return skips;
    try {
        var cats = encodeURIComponent('["sponsor","intro","outro","selfpromo"]');
        var apiUrl = "https://sponsor.ajay.app/api/skipSegments?videoID=" + encodeURIComponent(vid) + "&categories=" + cats;
        var res = fetch(apiUrl, {
            headers: { "Accept": "application/json" },
            timeout: 2500
        });
        if (!res || !res.ok) return skips;
        var arr = JSON.parse(res.text());
        if (!arr || !arr.length) return skips;
        var i = 0;
        for (i = 0; i < arr.length; i++) {
            var seg = arr[i];
            if (seg && seg.segment && seg.segment.length >= 2) {
                var fromMs = Math.round(Number(seg.segment[0]) * 1000);
                var toMs = Math.round(Number(seg.segment[1]) * 1000);
                if (!isNaN(fromMs) && !isNaN(toMs) && fromMs >= 0 && toMs > fromMs) {
                    skips.push({ fromTime: fromMs, toTime: toMs });
                }
            }
        }
    } catch (e) {}
    return skips;
}

function buildNativeTrack(streamUrl, mimeType, opts) {
    opts = opts || {};
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    var skips = [];
    var startSec = parseInt(opts.startSec || 0, 10) || 0;
    if (startSec > 0) {
        skips.push({
            fromTime: 0,
            toTime: Math.round(startSec * 1000)
        });
    }
    if (opts.vid) {
        var sbSkips = fetchSponsorBlockSkips(opts.vid);
        var i = 0;
        for (i = 0; i < sbSkips.length; i++) {
            skips.push(sbSkips[i]);
        }
    }

    var out = {
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: mimeType,
        headers: hdrs,
        timeSkip: skips
    };

    if (opts.subtitles && opts.subtitles.length > 0) {
        out.subtitles = opts.subtitles;
    }

    if (opts.audios && opts.audios.length > 0) {
        out.audios = opts.audios;
    } else if (opts.audioUrl) {
        out.audios = [{
            title: "Audio",
            label: "Audio",
            data: opts.audioUrl,
            headers: hdrs
        }];
    }

    return Response.success(out);
}

function resolveLazy(vid, startSec) {
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    var clients = ["ANDROID", "IOS", "ANDROID_VR"];
    var i = 0;
    for (i = 0; i < clients.length; i++) {
        var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
        if (itData && itData.streamingData) {
            var subs = extractInnerTubeSubtitles(itData);
            var adaptive = itData.streamingData.adaptiveFormats || [];
            var multiAudios = extractInnerTubeAudios(adaptive, hdrs);

            if (itData.streamingData.hlsManifestUrl) {
                return buildNativeTrack(String(itData.streamingData.hlsManifestUrl), "application/x-mpegURL", {
                    vid: vid,
                    startSec: startSec,
                    subtitles: subs,
                    audios: multiAudios
                });
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
            if (best && best.url) {
                return buildNativeTrack(String(best.url), "video/mp4", {
                    vid: vid,
                    startSec: startSec,
                    subtitles: subs,
                    audios: multiAudios
                });
            }

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
            if (bestV && bestV.url) {
                return buildNativeTrack(String(bestV.url), "video/mp4", {
                    vid: vid,
                    startSec: startSec,
                    audioUrl: bestA,
                    audios: multiAudios,
                    subtitles: subs
                });
            }
        }
    }

    var apiRes = requestApi("/streams/" + vid, { timeoutMs: 6000 });
    if (apiRes && apiRes.data) {
        var d = apiRes.data;
        var pSubs = apiRes.tier === "piped" ? extractPipedSubtitles(d) : [];
        if (d.hls) return buildNativeTrack(String(d.hls), "application/x-mpegURL", { vid: vid, startSec: startSec, subtitles: pSubs });
        if (d.hlsUrl) return buildNativeTrack(String(d.hlsUrl), "application/x-mpegURL", { vid: vid, startSec: startSec });
        var vs = d.videoStreams || d.formatStreams || [];
        var bestAlt = null;
        for (i = 0; i < vs.length; i++) {
            var s = vs[i];
            if (s && s.url && (s.videoOnly === false || s.container === "mp4")) {
                if (!bestAlt) bestAlt = s;
            }
        }
        if (bestAlt && bestAlt.url) {
            return buildNativeTrack(String(bestAlt.url), "video/mp4", { vid: vid, startSec: startSec, subtitles: pSubs });
        }
    }

    return Response.error("Không giải mã được stream YouTube (có thể IP bị chặn bot): " + vid);
}

function execute(data) {
    var s = String(data || "").trim();
    if (!s) return Response.error("Thiếu dữ liệu track");

    if (s.charAt(0) === "{") {
        try {
            var obj = JSON.parse(s);
            if (obj && obj.mode) {
                var opts = {
                    vid: obj.vid ? String(obj.vid) : "",
                    startSec: obj.startSec || 0,
                    subtitles: obj.subtitles || [],
                    audios: obj.audios || [],
                    audioUrl: obj.a ? String(obj.a) : ""
                };
                if (obj.mode === "hls" && obj.url) {
                    return buildNativeTrack(String(obj.url), "application/x-mpegURL", opts);
                }
                if (obj.mode === "mp4" && obj.url) {
                    return buildNativeTrack(String(obj.url), "video/mp4", opts);
                }
                if (obj.mode === "av" && obj.v) {
                    return buildNativeTrack(String(obj.v), "video/mp4", opts);
                }
            }
        } catch (e) {}
    }

    if (s.indexOf("hls|") === 0) {
        return buildNativeTrack(s.substring(4), "application/x-mpegURL", {});
    }
    if (s.indexOf("mp4|") === 0) {
        return buildNativeTrack(s.substring(4), "video/mp4", {});
    }
    if (s.indexOf("av|") === 0) {
        try {
            var av = JSON.parse(s.substring(3));
            if (av && av.v) return buildNativeTrack(String(av.v), "video/mp4", { audioUrl: av.a ? String(av.a) : "" });
        } catch (e) {}
    }
    if (s.indexOf("resolve:") === 0) {
        var raw = s.substring(8);
        var startSec = 0;
        var tIdx = raw.indexOf("|t=");
        if (tIdx !== -1) {
            startSec = parseInt(raw.substring(tIdx + 3), 10) || 0;
            raw = raw.substring(0, tIdx);
        }
        var vid = extractVideoId(raw);
        if (!vid) return Response.error("ID video không hợp lệ: " + s);
        return resolveLazy(vid, startSec);
    }

    var directVid = extractVideoId(s);
    if (directVid) return resolveLazy(directVid, extractStartSec(s));

    if (s.indexOf("http") === 0) {
        var mime = s.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4";
        return buildNativeTrack(s, mime, { startSec: extractStartSec(s) });
    }

    return Response.error("Định dạng track không hỗ trợ: " + s);
}
