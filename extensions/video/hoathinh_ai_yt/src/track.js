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

function fetchDanmakuFromComments(vid, startSec, endSec, totalDurSec) {
    var result = [];
    if (!vid || !isDanmakuEnabled()) return result;
    try {
        var rawTexts = [];
        var i = 0;
        var nextRes = requestInnerTube("next", { videoId: vid }, "WEB", 3000);
        var contents = nextRes && nextRes.contents && nextRes.contents.twoColumnWatchNextResults && nextRes.contents.twoColumnWatchNextResults.results && nextRes.contents.twoColumnWatchNextResults.results.results && nextRes.contents.twoColumnWatchNextResults.results.results.contents;
        var cTok = "";
        if (contents && contents.length) {
            for (i = 0; i < contents.length; i++) {
                var isr = contents[i] && contents[i].itemSectionRenderer;
                if (isr && isr.sectionIdentifier === "comment-item-section" && isr.contents) {
                    cTok = extractContinuationToken(isr.contents);
                    if (cTok) break;
                }
            }
            if (!cTok) {
                for (i = 0; i < contents.length; i++) {
                    var isr2 = contents[i] && contents[i].itemSectionRenderer;
                    if (isr2 && isr2.contents) {
                        cTok = extractContinuationToken(isr2.contents);
                        if (cTok) break;
                    }
                }
            }
        }
        var cRes = cTok ? requestInnerTube("next", { continuation: cTok }, "WEB", 3000) : null;
        if (cRes) {
            var entityMap = {};
            var mutations = cRes.frameworkUpdates && cRes.frameworkUpdates.entityBatchUpdate && cRes.frameworkUpdates.entityBatchUpdate.mutations;
            if (mutations && mutations.length) {
                for (i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    var cep = m && m.payload && m.payload.commentEntityPayload;
                    if (cep && cep.properties && cep.properties.commentId) {
                        entityMap[String(cep.properties.commentId)] = cep;
                    }
                }
            }

            var endpoints = cRes.onResponseReceivedEndpoints || [];
            for (i = 0; i < endpoints.length && rawTexts.length < 40; i++) {
                var ep = endpoints[i];
                var contItems = null;
                if (ep.reloadContinuationItemsCommand && ep.reloadContinuationItemsCommand.continuationItems) {
                    contItems = ep.reloadContinuationItemsCommand.continuationItems;
                } else if (ep.appendContinuationItemsAction && ep.appendContinuationItemsAction.continuationItems) {
                    contItems = ep.appendContinuationItemsAction.continuationItems;
                }
                if (!contItems || !contItems.length) continue;

                var j = 0;
                for (j = 0; j < contItems.length && rawTexts.length < 40; j++) {
                    var ci = contItems[j];
                    if (!ci || !ci.commentThreadRenderer) continue;
                    var ctr = ci.commentThreadRenderer;
                    var cr = ctr.comment && ctr.comment.commentRenderer;
                    var cvm = ctr.commentViewModel && ctr.commentViewModel.commentViewModel;
                    var txt = "";
                    if (cvm && cvm.commentKey && entityMap[cvm.commentKey]) {
                        var props = entityMap[cvm.commentKey].properties || {};
                        txt = props.content && props.content.content ? cleanText(props.content.content) : "";
                    } else if (cr) {
                        txt = getRunsText(cr.contentText);
                    }
                    if (txt) rawTexts.push(txt);
                }
            }
        }

        if (rawTexts.length === 0) {
            var pipedList = getCustomMirrors().concat(PIPED_INSTANCES);
            for (i = 0; i < pipedList.length && rawTexts.length === 0; i++) {
                var pj = fetchJsonSafe(pipedList[i] + "/comments/" + vid, 3000);
                if (pj && pj.comments && pj.comments.length > 0) {
                    var pk = 0;
                    for (pk = 0; pk < pj.comments.length && rawTexts.length < 40; pk++) {
                        var pc = pj.comments[pk];
                        if (pc && pc.commentText) {
                            var pTxt = cleanText(pc.commentText);
                            if (pTxt) rawTexts.push(pTxt);
                        }
                    }
                }
            }
        }

        if (rawTexts.length === 0) {
            for (i = 0; i < INVIDIOUS_INSTANCES.length && rawTexts.length === 0; i++) {
                var ij = fetchJsonSafe(INVIDIOUS_INSTANCES[i] + "/api/v1/comments/" + vid, 3000);
                if (ij && ij.comments && ij.comments.length > 0) {
                    var ik = 0;
                    for (ik = 0; ik < ij.comments.length && rawTexts.length < 40; ik++) {
                        var ic = ij.comments[ik];
                        if (ic && ic.content) {
                            var iTxt = cleanText(ic.content);
                            if (iTxt) rawTexts.push(iTxt);
                        }
                    }
                }
            }
        }

        if (rawTexts.length === 0) return result;

        var winStart = startSec > 0 ? startSec : 0;
        var winEnd = (endSec > winStart) ? endSec : (totalDurSec > winStart ? totalDurSec : (winStart + 1200));
        var span = winEnd - winStart;
        if (span <= 0) span = 1200;

        var colors = ["#FFFFFF", "#FFE082", "#80DEEA", "#FFAB91", "#A5D6A7"];
        for (i = 0; i < rawTexts.length; i++) {
            var t = rawTexts[i];
            if (t.length > 120) t = t.substring(0, 117) + "...";
            var tsMatch = t.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
            var sec = -1;
            if (tsMatch) {
                var parsedSec = parseDurationSec(tsMatch[1]);
                if (parsedSec >= winStart && parsedSec <= winEnd) {
                    sec = parsedSec;
                }
            }
            if (sec < 0) {
                sec = Math.round(winStart + (span * (i + 1)) / (rawTexts.length + 1));
            }
            result.push({
                time: sec,
                text: t,
                color: colors[i % colors.length],
                mode: "scroll"
            });
        }
    } catch (e) {}
    return result;
}

function buildNativeTrack(streamUrl, mimeType, opts) {
    opts = opts || {};
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    var skips = [];
    var startSec = parseInt(opts.startSec || 0, 10) || 0;
    var endSec = parseInt(opts.endSec || 0, 10) || 0;
    var totalDurSec = parseInt(opts.durSec || 0, 10) || 0;

    if (startSec > 0) {
        skips.push({
            fromTime: 0,
            toTime: Math.round(startSec * 1000)
        });
    }
    if (endSec > startSec && totalDurSec > endSec) {
        skips.push({
            fromTime: Math.round(endSec * 1000),
            toTime: Math.round(totalDurSec * 1000)
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

    if (opts.vid && isDanmakuEnabled()) {
        var dmItems = fetchDanmakuFromComments(opts.vid, startSec, endSec, totalDurSec);
        if (dmItems.length > 0) {
            out.danmaku = [{
                data: JSON.stringify(dmItems),
                type: "json",
                label: "Bình luận YouTube"
            }];
        }
    }

    return Response.success(out);
}

function buildFmp4TrackFromPair(pair, hdrs, opts) {
    if (!pair || !pair.vUrl || !pair.vInit || !pair.vIndex || !pair.aUrl || !pair.aInit || !pair.aIndex) return null;
    var videoM3u8 = buildFmp4MediaM3u8(pair.vUrl, pair.vInit, pair.vIndex, 3);
    if (!videoM3u8) return null;
    var audioM3u8 = buildFmp4MediaM3u8(pair.aUrl, pair.aInit, pair.aIndex, 4);
    if (!audioM3u8) return null;
    var audioUri = buildFmp4DataUri(audioM3u8);
    if (!audioUri) return null;

    var nextOpts = {
        vid: opts.vid || "",
        startSec: opts.startSec || 0,
        endSec: opts.endSec || 0,
        durSec: opts.durSec || 0,
        subtitles: opts.subtitles || [],
        audios: [{
            title: "Audio",
            label: "Tiếng Việt / Gốc",
            language: "vi",
            type: "application/x-mpegURL",
            data: audioUri,
            headers: hdrs
        }]
    };
    return buildNativeTrack(videoM3u8, "application/x-mpegURL", nextOpts);
}

function resolveAdaptiveFmp4Hls(obj, opts) {
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    if (obj.v && obj.a && obj.vInit && obj.vIndex && obj.aInit && obj.aIndex) {
        var direct = buildFmp4TrackFromPair({
            vUrl: String(obj.v),
            vInit: String(obj.vInit),
            vIndex: String(obj.vIndex),
            aUrl: String(obj.a),
            aInit: String(obj.aInit),
            aIndex: String(obj.aIndex)
        }, hdrs, opts);
        if (direct) return direct;
    }

    var vid = opts.vid || "";
    var targetH = parseInt(obj.height || 0, 10) || 1080;
    if (vid) {
        var clients = getPlayerClientsOrder();
        var i = 0;
        for (i = 0; i < clients.length; i++) {
            var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
            if (itData && itData.streamingData && itData.streamingData.adaptiveFormats) {
                var pair = findAdaptiveMp4Pair(itData.streamingData.adaptiveFormats, targetH);
                if (pair) {
                    var res = buildFmp4TrackFromPair(pair, hdrs, opts);
                    if (res) {
                        setPreferredPlayerClient(clients[i]);
                        return res;
                    }
                }
            }
        }
    }
    return buildNativeTrack(String(obj.v), obj.mimeType ? String(obj.mimeType) : "video/mp4", opts);
}

function resolveLazy(vid, startSec, endSec, durSec) {
    var hdrs = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL
    };
    var clients = getPlayerClientsOrder();
    var i = 0;
    for (i = 0; i < clients.length; i++) {
        var itData = requestInnerTube("player", { videoId: vid }, clients[i]);
        if (itData && itData.streamingData) {
            var subs = extractInnerTubeSubtitles(itData);
            var adaptive = itData.streamingData.adaptiveFormats || [];
            var multiAudios = extractInnerTubeAudios(adaptive, hdrs);
            var totalDur = durSec || parseDurationSec(itData.videoDetails && itData.videoDetails.lengthSeconds);

            if (itData.streamingData.hlsManifestUrl) {
                setPreferredPlayerClient(clients[i]);
                return buildNativeTrack(String(itData.streamingData.hlsManifestUrl), "application/x-mpegURL", {
                    vid: vid,
                    startSec: startSec,
                    endSec: endSec,
                    durSec: totalDur,
                    subtitles: subs,
                    audios: multiAudios
                });
            }
            var prefQ = getPreferredQuality();
            var wantH = prefQ === "720p" ? 720 : 1080;
            if (prefQ !== "auto_hls") {
                var hdPair = findAdaptiveMp4Pair(adaptive, wantH);
                if (hdPair) {
                    var hdTrack = buildFmp4TrackFromPair(hdPair, hdrs, {
                        vid: vid,
                        startSec: startSec,
                        endSec: endSec,
                        durSec: totalDur,
                        subtitles: subs
                    });
                    if (hdTrack) {
                        setPreferredPlayerClient(clients[i]);
                        return hdTrack;
                    }
                }
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
                setPreferredPlayerClient(clients[i]);
                return buildNativeTrack(String(best.url), "video/mp4", {
                    vid: vid,
                    startSec: startSec,
                    endSec: endSec,
                    durSec: totalDur,
                    subtitles: subs,
                    audios: multiAudios
                });
            }

            var fallbackPair = findAdaptiveMp4Pair(adaptive, wantH);
            if (fallbackPair) {
                var fbTrack = buildFmp4TrackFromPair(fallbackPair, hdrs, {
                    vid: vid,
                    startSec: startSec,
                    endSec: endSec,
                    durSec: totalDur,
                    subtitles: subs
                });
                if (fbTrack) {
                    setPreferredPlayerClient(clients[i]);
                    return fbTrack;
                }
            }
        }
    }

    var apiRes = requestApi("/streams/" + vid, { timeoutMs: 6000 });
    if (apiRes && apiRes.data) {
        var d = apiRes.data;
        var pSubs = apiRes.tier === "piped" ? extractPipedSubtitles(d) : [];
        if (d.hls) return buildNativeTrack(String(d.hls), "application/x-mpegURL", { vid: vid, startSec: startSec, endSec: endSec, durSec: durSec, subtitles: pSubs });
        if (d.hlsUrl) return buildNativeTrack(String(d.hlsUrl), "application/x-mpegURL", { vid: vid, startSec: startSec, endSec: endSec, durSec: durSec });
        var vs = d.videoStreams || d.formatStreams || [];
        var bestAlt = null;
        for (i = 0; i < vs.length; i++) {
            var s = vs[i];
            if (s && s.url && (s.videoOnly === false || s.container === "mp4")) {
                if (!bestAlt) bestAlt = s;
            }
        }
        if (bestAlt && bestAlt.url) {
            return buildNativeTrack(String(bestAlt.url), "video/mp4", { vid: vid, startSec: startSec, endSec: endSec, durSec: durSec, subtitles: pSubs });
        }
    }

    var dmFallback = resolveCrossSourceFallback(vid);
    if (dmFallback && dmFallback.url) {
        return buildNativeTrack(dmFallback.url, dmFallback.mimeType || "application/x-mpegURL", {
            vid: vid,
            startSec: startSec,
            endSec: endSec,
            durSec: durSec || dmFallback.duration || 0
        });
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
                    endSec: obj.endSec || 0,
                    durSec: obj.durSec || 0,
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
                    return resolveAdaptiveFmp4Hls(obj, opts);
                }
                if (obj.mode === "audio_only" && obj.a && obj.aInit && obj.aIndex) {
                    var aM3u8 = buildFmp4MediaM3u8(String(obj.a), String(obj.aInit), String(obj.aIndex), 4);
                    if (aM3u8) {
                        return buildNativeTrack(aM3u8, "application/x-mpegURL", opts);
                    }
                    return buildNativeTrack(String(obj.a), "audio/mp4", opts);
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
        var parts = raw.split("|");
        var rawId = parts[0];
        var rStart = 0;
        var rEnd = 0;
        var rDur = 0;
        var pi = 0;
        for (pi = 1; pi < parts.length; pi++) {
            var seg = parts[pi];
            if (seg.indexOf("t=") === 0) rStart = parseInt(seg.substring(2), 10) || 0;
            else if (seg.indexOf("end=") === 0) rEnd = parseInt(seg.substring(4), 10) || 0;
            else if (seg.indexOf("dur=") === 0) rDur = parseInt(seg.substring(4), 10) || 0;
        }
        var vid = extractVideoId(rawId);
        if (!vid) return Response.error("ID video không hợp lệ: " + s);
        return resolveLazy(vid, rStart, rEnd, rDur);
    }

    var directVid = extractVideoId(s);
    if (directVid) return resolveLazy(directVid, extractStartSec(s), extractEndSec(s), extractDurSec(s));

    if (s.indexOf("http") === 0) {
        var mime = s.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4";
        return buildNativeTrack(s, mime, {
            startSec: extractStartSec(s),
            endSec: extractEndSec(s),
            durSec: extractDurSec(s)
        });
    }

    return Response.error("Định dạng track không hỗ trợ: " + s);
}
