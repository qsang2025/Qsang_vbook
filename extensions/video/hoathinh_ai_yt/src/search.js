// search.js — tim kiem playlist, ban full >= 20 phut va kenh tuyen chon tren YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function collectSearchItems(contents, items, seen, filterMode) {
    if (!contents || !contents.length) return "";
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
                                    host: BASE_URL
                                });
                            }
                        } else if (parsed.kind === "video" && filterMode !== "playlist") {
                            if (!isShortOrTooShort(parsed.link, parsed.durationSec, 1200) && !seen[parsed.link]) {
                                seen[parsed.link] = true;
                                items.push({
                                    name: parsed.name,
                                    cover: parsed.cover,
                                    link: parsed.link,
                                    description: parsed.description,
                                    host: BASE_URL
                                });
                            }
                        }
                    }
                } else if (s.videoRenderer && filterMode !== "playlist") {
                    var vItem = parseVideoRenderer(s.videoRenderer);
                    if (vItem && !seen[vItem.link]) {
                        seen[vItem.link] = true;
                        items.push(vItem);
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
                    if (pv && !isShortOrTooShort(pv.link, pv.durationSec, 1200) && !seen[pv.link]) {
                        seen[pv.link] = true;
                        items.push({
                            name: pv.name,
                            cover: pv.cover,
                            link: pv.link,
                            description: pv.description,
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

function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");
    page = page ? String(page).trim() : "";

    if (query === "channels:featured") {
        var chItems = [];
        var i = 0;
        for (i = 0; i < FEATURED_CHANNELS.length; i++) {
            var ch = FEATURED_CHANNELS[i];
            chItems.push({
                name: ch.title,
                cover: ch.cover,
                link: BASE_URL + "/channel/" + ch.id,
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

    var filterMode = "all";
    var searchKw = query;
    var params = "";
    if (query.indexOf("playlist:") === 0) {
        filterMode = "playlist";
        searchKw = cleanText(query.substring(9));
        params = "EgIQAw==";
    } else if (query.indexOf("video:") === 0) {
        filterMode = "video";
        searchKw = cleanText(query.substring(6));
        params = "EgIYAg==";
    }

    if (!searchKw) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var payload = page ? { continuation: page } : { query: searchKw };
    if (!page && params) payload.params = params;

    var res = requestInnerTube("search", payload, "WEB");
    if (!res) return Response.error("Không tải được kết quả tìm kiếm YouTube: " + searchKw);

    var items = [];
    var seen = {};
    var next = "";

    if (res.onResponseReceivedCommands && res.onResponseReceivedCommands[0] && res.onResponseReceivedCommands[0].appendContinuationItemsAction) {
        next = collectSearchItems(res.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems, items, seen, filterMode);
    } else if (res.contents && res.contents.twoColumnSearchResultsRenderer && res.contents.twoColumnSearchResultsRenderer.primaryContents && res.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer) {
        next = collectSearchItems(res.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents, items, seen, filterMode);
    }

    return Response.success(items, next || "");
}
