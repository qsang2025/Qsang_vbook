// detail.js — chi tiet Playlist, Video Ban Full hoac Kenh YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function detailPlaylist(listId) {
    var res = requestInnerTube("browse", { browseId: "VL" + listId }, "WEB");
    if (!res) return Response.error("Không tải được thông tin playlist: " + listId);

    var title = "";
    var author = "";
    var channelId = "";
    var desc = "";
    var cover = "";
    var countText = "";

    var hdr = res.header && res.header.playlistHeaderRenderer;
    if (hdr) {
        title = getRunsText(hdr.title);
        author = getRunsText(hdr.ownerText);
        desc = getRunsText(hdr.descriptionText);
        countText = getRunsText(hdr.numVideosText);
        if (hdr.ownerEndpoint && hdr.ownerEndpoint.browseEndpoint && hdr.ownerEndpoint.browseEndpoint.browseId) {
            channelId = String(hdr.ownerEndpoint.browseEndpoint.browseId);
        }
        if (hdr.playlistHeaderBanner && hdr.playlistHeaderBanner.heroPlaylistThumbnailRenderer && hdr.playlistHeaderBanner.heroPlaylistThumbnailRenderer.thumbnail) {
            cover = pickBestThumb(hdr.playlistHeaderBanner.heroPlaylistThumbnailRenderer.thumbnail.thumbnails, "");
        }
    }

    var pHdr = res.header && res.header.pageHeaderRenderer && res.header.pageHeaderRenderer.content && res.header.pageHeaderRenderer.content.pageHeaderViewModel;
    if (pHdr) {
        if (!title && pHdr.title && pHdr.title.dynamicTextViewModel && pHdr.title.dynamicTextViewModel.text) {
            title = cleanText(pHdr.title.dynamicTextViewModel.text.content || "");
        }
        if (!cover && pHdr.heroImage && pHdr.heroImage.contentPreviewImageViewModel && pHdr.heroImage.contentPreviewImageViewModel.image) {
            cover = pickBestThumb(pHdr.heroImage.contentPreviewImageViewModel.image.sources, "");
        }
    }

    var firstVid = "";
    var tabs = res.contents && res.contents.twoColumnBrowseResultsRenderer && res.contents.twoColumnBrowseResultsRenderer.tabs;
    var items = tabs && tabs[0] && tabs[0].tabRenderer && tabs[0].tabRenderer.content && tabs[0].tabRenderer.content.sectionListRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents && tabs[0].tabRenderer.content.sectionListRenderer.contents[0] && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    if (items && items.length > 0 && items[0].lockupViewModel) {
        var first = parseLockupViewModel(items[0].lockupViewModel);
        if (first) {
            if (first.id) firstVid = first.id;
            else if (first.link) firstVid = extractVideoId(first.link) || "";
            if (!cover) cover = first.cover;
            if (!title) title = first.name;
            if (!author) author = first.channelName;
            if (!channelId) channelId = first.channelId;
        }
    }

    if (!title) title = "Playlist " + listId;
    var detailParts = [];
    if (countText) detailParts.push(countText);
    if (author) detailParts.push("Kênh: " + author);

    var result = {
        name: title,
        author: author,
        cover: cover,
        description: desc || detailParts.join(" • "),
        detail: detailParts.join(" • "),
        url: BASE_URL + "/playlist?list=" + listId,
        type: "video",
        format: "series",
        ongoing: true
    };
    var plSuggests = [];
    if (firstVid) {
        plSuggests.push({
            title: "Đề xuất liên quan (YouTube Up Next)",
            input: "related:" + firstVid,
            script: "search.js"
        });
    }
    if (channelId) {
        result.genres = [{
            title: author || "Xem kênh",
            input: "channel:" + channelId,
            script: "search.js"
        }];
        plSuggests.push({
            title: "Cùng kênh: " + (author || channelId),
            input: "channel:" + channelId,
            script: "search.js"
        });
    }
    plSuggests.push({
        title: "Bộ AI Dài Tập Liên Quan",
        input: "playlist:hoạt hình AI Trung Quốc trọn bộ",
        script: "search.js"
    });
    result.suggests = plSuggests;
    result.comment = {
        title: "Bình luận YouTube",
        input: BASE_URL + "/playlist?list=" + listId,
        script: "comment.js"
    };
    return Response.success(result);
}

function fetchPlayerDetailsFallback(vid) {
    try {
        var res = fetch(BASE_URL + "/watch?v=" + vid + "&hl=vi", { timeout: 12000 });
        if (!res || !res.ok) return null;
        var html = res.text();
        var marker = "var ytInitialPlayerResponse = ";
        var idx = html.indexOf(marker);
        if (idx === -1) return null;
        var start = idx + marker.length;
        var end = html.indexOf(";</script>", start);
        if (end === -1) return null;
        var parsed = JSON.parse(html.substring(start, end));
        return parsed && parsed.videoDetails ? parsed.videoDetails : null;
    } catch (e) {
        return null;
    }
}

function detailVideo(vid) {
    var vd = null;
    var pRes = requestInnerTube("player", { videoId: vid }, "WEB");
    if (pRes && pRes.videoDetails) vd = pRes.videoDetails;
    if (!vd) vd = fetchPlayerDetailsFallback(vid);
    if (!vd || !vd.title) return Response.error("Không tải được thông tin video: " + vid);

    var durSec = parseDurationSec(vd.lengthSeconds);
    var durFmt = formatDuration(durSec);
    var author = cleanText(vd.author || "");
    var detailParts = [];
    if (durFmt) detailParts.push("Thời lượng: " + durFmt);
    if (author) detailParts.push("Kênh: " + author);
    if (vd.viewCount) detailParts.push("Lượt xem: " + vd.viewCount);

    var cover = pickBestThumb(vd.thumbnail && vd.thumbnail.thumbnails, vid);
    recordWatchedVideo(vid, cleanText(vd.title), cover, durFmt);
    var result = {
        name: cleanText(vd.title),
        author: author,
        cover: cover,
        description: cleanText(vd.shortDescription || ""),
        detail: detailParts.join(" • "),
        url: BASE_URL + "/watch?v=" + vid,
        type: "video",
        format: "stream",
        ongoing: false
    };
    var vidSuggests = [{
        title: "Đề xuất liên quan (YouTube Up Next)",
        input: "related:" + vid,
        script: "search.js"
    }];
    if (vd.channelId) {
        result.genres = [{
            title: author || "Xem kênh",
            input: "channel:" + vd.channelId,
            script: "search.js"
        }];
        vidSuggests.push({
            title: "Cùng kênh: " + (author || vd.channelId),
            input: "channel:" + vd.channelId,
            script: "search.js"
        });
    }
    vidSuggests.push({
        title: "Bộ AI Dài Tập Liên Quan",
        input: "playlist:hoạt hình AI Trung Quốc trọn bộ",
        script: "search.js"
    });
    result.suggests = vidSuggests;
    result.comment = {
        title: "Bình luận YouTube",
        input: BASE_URL + "/watch?v=" + vid,
        script: "comment.js"
    };
    return Response.success(result);
}

function detailChannel(cid) {
    var res = requestInnerTube("browse", { browseId: cid }, "WEB");
    if (!res || !res.metadata || !res.metadata.channelMetadataRenderer) {
        return Response.error("Không tải được thông tin kênh: " + cid);
    }
    var m = res.metadata.channelMetadataRenderer;
    var cover = pickBestThumb(m.avatar && m.avatar.thumbnails, "");
    var title = cleanText(m.title || cid);
    return Response.success({
        name: title,
        author: title,
        cover: cover,
        description: cleanText(m.description || ""),
        detail: "Kênh YouTube • " + cid,
        url: BASE_URL + "/channel/" + cid,
        type: "video",
        format: "series",
        ongoing: true,
        genres: [{
            title: "Playlist & Video của kênh",
            input: "channel:" + cid,
            script: "search.js"
        }],
        suggests: [
            {
                title: "Cùng kênh: " + title,
                input: "channel:" + cid,
                script: "search.js"
            },
            {
                title: "Bộ AI Dài Tập Liên Quan",
                input: "playlist:hoạt hình AI Trung Quốc trọn bộ",
                script: "search.js"
            }
        ]
    });
}

function execute(url) {
    url = normYtUrl(url);
    var listId = extractPlaylistId(url);
    if (listId) return detailPlaylist(listId);

    var vid = extractVideoId(url);
    if (vid) return detailVideo(vid);

    var cid = resolveChannelId(url);
    if (cid) return detailChannel(cid);

    return Response.error("URL YouTube không hợp lệ: " + url);
}
