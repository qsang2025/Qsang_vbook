// toc.js — danh sach tap cua Playlist, Video Ban Full hoac Kenh YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function isDeletedOrPrivate(title) {
    var t = String(title || "").toLowerCase();
    return t === "[private video]" || t === "[deleted video]" || t === "private video" || t === "deleted video";
}

function tocPlaylist(listId) {
    var episodes = [];
    var seen = {};
    var token = "";
    var pageCount = 0;

    while (pageCount < 10) {
        var payload = token ? { continuation: token } : { browseId: "VL" + listId };
        var res = requestInnerTube("browse", payload, "WEB");
        if (!res) break;

        var items = null;
        if (token) {
            if (res.onResponseReceivedActions && res.onResponseReceivedActions[0] && res.onResponseReceivedActions[0].appendContinuationItemsAction) {
                items = res.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
            }
        } else {
            var tabs = res.contents && res.contents.twoColumnBrowseResultsRenderer && res.contents.twoColumnBrowseResultsRenderer.tabs;
            items = tabs && tabs[0] && tabs[0].tabRenderer && tabs[0].tabRenderer.content && tabs[0].tabRenderer.content.sectionListRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents && tabs[0].tabRenderer.content.sectionListRenderer.contents[0] && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
        }
        if (!items || !items.length) break;

        var i = 0;
        for (i = 0; i < items.length; i++) {
            var it = items[i];
            if (it && it.lockupViewModel) {
                var parsed = parseLockupViewModel(it.lockupViewModel);
                if (parsed && parsed.id && !isDeletedOrPrivate(parsed.name)) {
                    if (!isShortOrTooShort(parsed.link, parsed.durationSec, 120) && !seen[parsed.link]) {
                        seen[parsed.link] = true;
                        episodes.push({
                            name: formatCleanEpisodeTitle(parsed.name, episodes.length + 1),
                            url: parsed.link,
                            description: parsed.durationText || "",
                            lock: false,
                            pay: false
                        });
                    }
                }
            }
        }

        token = extractContinuationToken(items);
        if (!token) break;
        pageCount += 1;
    }

    if (episodes.length === 0) {
        return Response.error("Không tìm thấy tập nào trong playlist: " + listId);
    }
    return Response.success(normalizeEpisodeOrder(episodes));
}

function tocChannel(cid) {
    var episodes = [];
    var seen = {};
    var res = requestInnerTube("browse", {
        browseId: cid,
        params: "EgZ2aWRlb3PyBgQKAjoA"
    }, "WEB");
    if (res && res.contents && res.contents.twoColumnBrowseResultsRenderer && res.contents.twoColumnBrowseResultsRenderer.tabs) {
        var tabs = res.contents.twoColumnBrowseResultsRenderer.tabs;
        var i = 0;
        for (i = 0; i < tabs.length; i++) {
            var tr = tabs[i].tabRenderer;
            if (tr && tr.selected && tr.content && tr.content.richGridRenderer && tr.content.richGridRenderer.contents) {
                var rc = tr.content.richGridRenderer.contents;
                var j = 0;
                for (j = 0; j < rc.length; j++) {
                    var vm = rc[j].richItemRenderer && rc[j].richItemRenderer.content && rc[j].richItemRenderer.content.lockupViewModel;
                    if (vm) {
                        var p = parseLockupViewModel(vm);
                        var minSec = getMinDurationSec();
                        if (p && !isShortOrTooShort(p.link, p.durationSec, minSec) && !seen[p.link]) {
                            seen[p.link] = true;
                            episodes.push({
                                name: p.name,
                                url: p.link,
                                description: p.durationText || "",
                                lock: false,
                                pay: false
                            });
                        }
                    }
                }
                break;
            }
        }
    }
    if (episodes.length === 0) {
        return Response.error("Không tìm thấy video dài (>= " + Math.floor(getMinDurationSec() / 60) + " phút) trên kênh: " + cid);
    }
    return Response.success(episodes);
}

function parseTimestampsFromDescription(desc, durSec) {
    var list = [];
    if (!desc) return list;
    var lines = String(desc).split(/\r?\n/);
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        var line = cleanText(lines[i]);
        if (!line) continue;
        var m = line.match(/^(?:[-*•]\s*)?(?:\[|\()?\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:\]|\))?\s*[-–:|•]?\s*(.*)$/);
        if (!m) continue;
        var sec = parseDurationSec(m[1]);
        if (durSec > 0 && sec >= durSec) continue;
        if (list.length > 0 && sec <= list[list.length - 1].startSec) continue;
        var label = cleanText(m[2] || "");
        list.push({
            startSec: sec,
            label: label
        });
    }
    return list;
}

function findSiblingSeriesParts(channelId, currentVid, baseTitle) {
    var siblings = [];
    if (!channelId || !baseTitle || baseTitle.length < 6) return siblings;
    var res = requestInnerTube("browse", {
        browseId: channelId,
        params: "EgZ2aWRlb3PyBgQKAjoA"
    }, "WEB");
    if (!res || !res.contents || !res.contents.twoColumnBrowseResultsRenderer || !res.contents.twoColumnBrowseResultsRenderer.tabs) {
        return siblings;
    }
    var tabs = res.contents.twoColumnBrowseResultsRenderer.tabs;
    var minSec = getMinDurationSec();
    var seen = {};
    var i = 0;
    for (i = 0; i < tabs.length; i++) {
        var tr = tabs[i].tabRenderer;
        if (tr && tr.selected && tr.content && tr.content.richGridRenderer && tr.content.richGridRenderer.contents) {
            var rc = tr.content.richGridRenderer.contents;
            var j = 0;
            for (j = 0; j < rc.length; j++) {
                var vm = rc[j].richItemRenderer && rc[j].richItemRenderer.content && rc[j].richItemRenderer.content.lockupViewModel;
                if (!vm) continue;
                var p = parseLockupViewModel(vm);
                if (!p || !p.id || p.id === currentVid || seen[p.id]) continue;
                if (isNoiseVideoTitle(p.name)) continue;
                if (!p.durationSec || p.durationSec < minSec) continue;
                if (extractBaseSeriesTitle(p.name) !== baseTitle) continue;
                seen[p.id] = true;
                siblings.push({
                    name: p.name,
                    url: p.link,
                    description: p.durationText || "",
                    lock: false,
                    pay: false,
                    _partNum: extractPartNumber(p.name)
                });
            }
            break;
        }
    }
    siblings.sort(function (a, b) {
        if (a._partNum !== b._partNum) return a._partNum - b._partNum;
        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });
    var out = [];
    for (i = 0; i < siblings.length; i++) {
        out.push({
            name: siblings[i].name,
            url: siblings[i].url,
            description: siblings[i].description,
            lock: false,
            pay: false
        });
    }
    return out;
}

function tocVideo(vid) {
    var title = "";
    var channelId = "";
    var shortDesc = "";
    var durSec = 0;
    var pRes = requestInnerTube("player", { videoId: vid }, "WEB");
    if (pRes && pRes.videoDetails) {
        title = cleanText(pRes.videoDetails.title || "");
        channelId = pRes.videoDetails.channelId ? String(pRes.videoDetails.channelId) : "";
        shortDesc = String(pRes.videoDetails.shortDescription || "");
        durSec = parseDurationSec(pRes.videoDetails.lengthSeconds);
    }
    var durFmt = durSec > 0 ? formatDuration(durSec) : "";
    var episodes = [{
        name: "Xem Bản Full (Trọn Bộ)",
        url: BASE_URL + "/watch?v=" + vid,
        description: durFmt,
        lock: false,
        pay: false
    }];

    var stamps = parseTimestampsFromDescription(shortDesc, durSec);
    var i = 0;
    if (stamps.length >= 2) {
        for (i = 0; i < stamps.length; i++) {
            var st = stamps[i];
            var lbl = st.label ? st.label : ("Phần " + (i + 1));
            var tsFmt = formatTimestamp(st.startSec);
            var stEnd = (i + 1 < stamps.length) ? stamps[i + 1].startSec : durSec;
            var stUrl = BASE_URL + "/watch?v=" + vid + "&t=" + st.startSec;
            if (stEnd > st.startSec) stUrl += "&end=" + stEnd;
            if (durSec > 0) stUrl += "&dur=" + durSec;
            episodes.push({
                name: lbl + " (" + tsFmt + ")",
                url: stUrl,
                description: tsFmt,
                lock: false,
                pay: false
            });
        }
    } else if (durSec >= 3600) {
        var step = 1800;
        var idx = 1;
        var sec = 0;
        while (sec < durSec) {
            var markerFmt = formatTimestamp(sec);
            var segEnd = sec + step;
            if (segEnd > durSec) segEnd = durSec;
            var segUrl = BASE_URL + "/watch?v=" + vid + "&t=" + sec;
            if (segEnd > sec) segUrl += "&end=" + segEnd;
            if (durSec > 0) segUrl += "&dur=" + durSec;
            episodes.push({
                name: "Phần " + idx + " (" + markerFmt + ")",
                url: segUrl,
                description: markerFmt,
                lock: false,
                pay: false
            });
            sec += step;
            idx += 1;
        }
    }

    var baseTitle = extractBaseSeriesTitle(title);
    if (channelId && baseTitle.length >= 6) {
        var siblingParts = findSiblingSeriesParts(channelId, vid, baseTitle);
        for (i = 0; i < siblingParts.length; i++) {
            episodes.push(siblingParts[i]);
        }
    }

    return Response.success(episodes);
}

function execute(url) {
    url = normYtUrl(url);
    var listId = extractPlaylistId(url);
    if (listId) return tocPlaylist(listId);

    var vid = extractVideoId(url);
    if (vid) return tocVideo(vid);

    var cid = resolveChannelId(url);
    if (cid) return tocChannel(cid);

    return Response.error("URL YouTube không hợp lệ: " + url);
}
