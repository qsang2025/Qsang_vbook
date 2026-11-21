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
                            name: parsed.name,
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
                        if (p && !isShortOrTooShort(p.link, p.durationSec, 1200) && !seen[p.link]) {
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
        return Response.error("Không tìm thấy video dài (>= 20 phút) trên kênh: " + cid);
    }
    return Response.success(episodes);
}

function execute(url) {
    url = normYtUrl(url);
    var listId = extractPlaylistId(url);
    if (listId) return tocPlaylist(listId);

    var vid = extractVideoId(url);
    if (vid) {
        return Response.success([{
            name: "Xem Bản Full",
            url: BASE_URL + "/watch?v=" + vid,
            description: "",
            lock: false,
            pay: false
        }]);
    }

    var cid = resolveChannelId(url);
    if (cid) return tocChannel(cid);

    return Response.error("URL YouTube không hợp lệ: " + url);
}
