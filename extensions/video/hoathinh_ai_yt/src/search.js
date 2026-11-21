// search.js — tim kiem playlist, ban full >= 20 phut va kenh tuyen chon tren YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function collectSearchItems(contents, items, seen, filterMode, minDur) {
    if (!contents || !contents.length) return "";
    var limitSec = (minDur && minDur > 0) ? minDur : getMinDurationSec();
    var i = 0;
    var nextToken = "";
    for (i = 0; i < contents.length; i++) {
        var entry = contents[i];
        if (!entry) continue;
        if (entry.itemSectionRenderer && entry.itemSectionRenderer.contents) {
            var sub = entry.itemSectionRenderer.contents;
            var j = 0;
            for (j = 0; j < sub.length; j++) {
                var s = sub[j];
                if (!s) continue;
                if (s.lockupViewModel) {
                    var parsed = parseLockupViewModel(s.lockupViewModel);
                    if (parsed) {
                        if (parsed.kind === "playlist" && filterMode !== "video") {
                            if (!seen[parsed.link]) {
                                seen[parsed.link] = true;
                                items.push({
                                    name: parsed.name,
                                    cover: parsed.cover,
                                    link: parsed.link,
                                    description: parsed.description,
                                    tag: parsed.tag || "",
                                    host: BASE_URL
                                });
                            }
                        } else if (parsed.kind === "video" && filterMode !== "playlist") {
                            if (!isNoiseVideoTitle(parsed.name) && parsed.durationSec > 0 && !isShortOrTooShort(parsed.link, parsed.durationSec, limitSec) && !seen[parsed.link]) {
                                seen[parsed.link] = true;
                                items.push({
                                    name: parsed.name,
                                    cover: parsed.cover,
                                    link: parsed.link,
                                    description: parsed.description,
                                    tag: parsed.tag || "",
                                    host: BASE_URL
                                });
                            }
                        }
                    }
                } else if (s.videoRenderer && filterMode !== "playlist") {
                    var vItem = parseVideoRenderer(s.videoRenderer);
                    if (vItem && !isNoiseVideoTitle(vItem.name) && vItem.durationSec > 0 && !isShortOrTooShort(vItem.link, vItem.durationSec, limitSec) && !seen[vItem.link]) {
                        seen[vItem.link] = true;
                        items.push({
                            name: vItem.name,
                            cover: vItem.cover,
                            link: vItem.link,
                            description: vItem.description,
                            tag: vItem.tag || "",
                            host: vItem.host
                        });
                    }
                }
            }
        } else if (entry.continuationItemRenderer) {
            var tok = extractContinuationToken([entry]);
            if (tok) nextToken = tok;
        }
    }
    return nextToken;
}

function searchChannel(cid, page) {
    var items = [];
    var seen = {};
    var i = 0;

    if (!page) {
        var plRes = requestInnerTube("browse", {
            browseId: cid,
            params: "EglwbGF5bGlzdHPyBgoKCEIGCgIQaCIA"
        }, "WEB");
        if (plRes && plRes.contents && plRes.contents.twoColumnBrowseResultsRenderer && plRes.contents.twoColumnBrowseResultsRenderer.tabs) {
            var tabs = plRes.contents.twoColumnBrowseResultsRenderer.tabs;
            for (i = 0; i < tabs.length; i++) {
                var tr = tabs[i].tabRenderer;
                if (tr && tr.selected && tr.content && tr.content.sectionListRenderer) {
                    var sec0 = tr.content.sectionListRenderer.contents && tr.content.sectionListRenderer.contents[0];
                    var gridItems = sec0 && sec0.itemSectionRenderer && sec0.itemSectionRenderer.contents && sec0.itemSectionRenderer.contents[0] && sec0.itemSectionRenderer.contents[0].gridRenderer && sec0.itemSectionRenderer.contents[0].gridRenderer.items;
                    if (gridItems) {
                        var k = 0;
                        for (k = 0; k < gridItems.length; k++) {
                            var vm = gridItems[k].lockupViewModel;
                            if (vm) {
                                var p = parseLockupViewModel(vm);
                                if (p && !seen[p.link]) {
                                    seen[p.link] = true;
                                    items.push({
                                        name: p.name,
                                        cover: p.cover,
                                        link: p.link,
                                        description: p.description,
                                        tag: p.tag || "",
                                        host: BASE_URL
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    var vidPayload = page ? { continuation: page } : { browseId: cid, params: "EgZ2aWRlb3PyBgQKAjoA" };
    var vidRes = requestInnerTube("browse", vidPayload, "WEB");
    var next = "";
    if (vidRes) {
        var richContents = null;
        if (vidRes.onResponseReceivedActions && vidRes.onResponseReceivedActions[0] && vidRes.onResponseReceivedActions[0].appendContinuationItemsAction) {
            richContents = vidRes.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
        } else if (vidRes.contents && vidRes.contents.twoColumnBrowseResultsRenderer && vidRes.contents.twoColumnBrowseResultsRenderer.tabs) {
            var vTabs = vidRes.contents.twoColumnBrowseResultsRenderer.tabs;
            for (i = 0; i < vTabs.length; i++) {
                var vtr = vTabs[i].tabRenderer;
                if (vtr && vtr.selected && vtr.content && vtr.content.richGridRenderer) {
                    richContents = vtr.content.richGridRenderer.contents;
                    break;
                }
            }
        }
        if (richContents) {
            for (i = 0; i < richContents.length; i++) {
                var rc = richContents[i];
                if (rc.richItemRenderer && rc.richItemRenderer.content && rc.richItemRenderer.content.lockupViewModel) {
                    var pv = parseLockupViewModel(rc.richItemRenderer.content.lockupViewModel);
                    if (pv && !isNoiseVideoTitle(pv.name) && pv.durationSec > 0 && !isShortOrTooShort(pv.link, pv.durationSec, getMinDurationSec()) && !seen[pv.link]) {
                        seen[pv.link] = true;
                        items.push({
                            name: pv.name,
                            cover: pv.cover,
                            link: pv.link,
                            description: pv.description,
                            tag: pv.tag || "",
                            host: BASE_URL
                        });
                    }
                } else if (rc.continuationItemRenderer) {
                    var ctok = extractContinuationToken([rc]);
                    if (ctok) next = ctok;
                }
            }
        }
    }

    return Response.success(items, next);
}

function getSearchParams(filterMode, sortBy) {
    if (filterMode === "playlist") return "EgIQAw==";
    if (filterMode === "video") {
        if (sortBy === "upload_date") return "CAISAhgC";
        if (sortBy === "view_count") return "CAMSAhgC";
        return "EgIYAg==";
    }
    if (sortBy === "upload_date") return "CAI=";
    if (sortBy === "view_count") return "CAM=";
    if (sortBy === "duration") return "EgIYAg==";
    return "";
}

function applyAudioFilterToQuery(kw, audioFilter) {
    var lower = String(kw || "").toLowerCase();
    if (audioFilter === "thuyet_minh") {
        if (lower.indexOf("thuyết minh") === -1 && lower.indexOf("thuyet minh") === -1 &&
            lower.indexOf("lồng tiếng") === -1 && lower.indexOf("long tieng") === -1) {
            return kw + " thuyết minh";
        }
    } else if (audioFilter === "tron_bo") {
        if (lower.indexOf("trọn bộ") === -1 && lower.indexOf("tron bo") === -1 &&
            !/\bfull\b/i.test(lower)) {
            return kw + " trọn bộ";
        }
    }
    return kw;
}

function matchesAudioFilter(name, audioFilter) {
    var s = String(name || "").toLowerCase();
    if (audioFilter === "thuyet_minh") {
        return s.indexOf("thuyết minh") !== -1 || s.indexOf("thuyet minh") !== -1 ||
            s.indexOf("lồng tiếng") !== -1 || s.indexOf("long tieng") !== -1;
    }
    if (audioFilter === "tron_bo") {
        return s.indexOf("trọn bộ") !== -1 || s.indexOf("tron bo") !== -1 || /\bfull\b/i.test(s);
    }
    return false;
}

function prioritizeByAudioFilter(items, audioFilter) {
    if (!items || items.length < 2 || audioFilter === "all") return items;
    var matched = [];
    var rest = [];
    var i = 0;
    for (i = 0; i < items.length; i++) {
        if (matchesAudioFilter(items[i].name, audioFilter)) {
            matched.push(items[i]);
        } else {
            rest.push(items[i]);
        }
    }
    return matched.concat(rest);
}

function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");
    page = page ? String(page).trim() : "";

    if (query === "channels:featured") {
        var allChannels = getAllFeaturedChannels();
        var chItems = [];
        var i = 0;
        for (i = 0; i < allChannels.length; i++) {
            var ch = allChannels[i];
            var chLink = ch.id ? (BASE_URL + "/channel/" + ch.id) : (BASE_URL + ch.handle);
            chItems.push({
                name: ch.title,
                cover: ch.cover,
                link: chLink,
                description: ch.description,
                host: BASE_URL
            });
        }
        return Response.success(chItems, "");
    }

    if (query.indexOf("channel:") === 0) {
        var cid = cleanText(query.substring(8));
        if (!cid) return Response.error("Thiếu ID kênh YouTube");
        return searchChannel(cid, page);
    }

    var minDurOverride = 0;
    var sortOverride = "";
    var workQ = query;
    while (true) {
        var mMin = workQ.match(/^min:(\d+):(.*)$/);
        if (mMin) {
            minDurOverride = parseInt(mMin[1], 10) || 0;
            workQ = cleanText(mMin[2]);
            continue;
        }
        var mSort = workQ.match(/^sort:([a-z_]+):(.*)$/);
        if (mSort) {
            sortOverride = String(mSort[1]);
            workQ = cleanText(mSort[2]);
            continue;
        }
        break;
    }

    var filterMode = "all";
    var searchKw = workQ;
    if (workQ.indexOf("playlist:") === 0) {
        filterMode = "playlist";
        searchKw = cleanText(workQ.substring(9));
    } else if (workQ.indexOf("video:") === 0) {
        filterMode = "video";
        searchKw = cleanText(workQ.substring(6));
    }

    if (!searchKw) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var audioFilter = getAudioFilter();
    var apiKw = applyAudioFilterToQuery(searchKw, audioFilter);
    var activeSort = sortOverride || getSortBy();
    var activeMinDur = minDurOverride > 0 ? minDurOverride : getMinDurationSec();
    var params = getSearchParams(filterMode, activeSort);
    var payload = page ? { continuation: page } : { query: apiKw };
    if (!page && params) payload.params = params;

    var res = requestInnerTube("search", payload, "WEB");
    if (!res) return Response.error("Không tải được kết quả tìm kiếm YouTube: " + searchKw);

    var items = [];
    var seen = {};
    var next = "";

    if (res.onResponseReceivedCommands && res.onResponseReceivedCommands[0] && res.onResponseReceivedCommands[0].appendContinuationItemsAction) {
        next = collectSearchItems(res.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems, items, seen, filterMode, activeMinDur);
    } else if (res.contents && res.contents.twoColumnSearchResultsRenderer && res.contents.twoColumnSearchResultsRenderer.primaryContents && res.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer) {
        next = collectSearchItems(res.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents, items, seen, filterMode, activeMinDur);
    }

    items = prioritizeByAudioFilter(items, audioFilter);
    return Response.success(items, next || "");
}
