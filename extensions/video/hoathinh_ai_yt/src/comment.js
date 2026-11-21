// comment.js — doc binh luan YouTube (InnerTube next + Piped + Invidious fallback).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function resolveFirstPlaylistVideo(listId) {
    var res = requestInnerTube("browse", { browseId: "VL" + listId }, "WEB");
    if (!res) return "";
    var tabs = res.contents && res.contents.twoColumnBrowseResultsRenderer && res.contents.twoColumnBrowseResultsRenderer.tabs;
    var items = tabs && tabs[0] && tabs[0].tabRenderer && tabs[0].tabRenderer.content && tabs[0].tabRenderer.content.sectionListRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents && tabs[0].tabRenderer.content.sectionListRenderer.contents[0] && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer && tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    if (!items || !items.length) return "";
    var i = 0;
    for (i = 0; i < items.length; i++) {
        var it = items[i];
        if (it && it.lockupViewModel && it.lockupViewModel.contentId) {
            return String(it.lockupViewModel.contentId);
        }
        if (it && it.playlistVideoRenderer && it.playlistVideoRenderer.videoId) {
            return String(it.playlistVideoRenderer.videoId);
        }
    }
    return "";
}

function buildCommentDesc(timeText, likesText, replyCount) {
    var parts = [];
    if (timeText) parts.push(cleanText(timeText));
    if (likesText && String(likesText) !== "0") parts.push("👍 " + cleanText(likesText));
    if (replyCount && parseInt(replyCount, 10) > 0) parts.push(replyCount + " phản hồi");
    return parts.join(" • ");
}

function findCommentSectionToken(nextRes) {
    var contents = nextRes && nextRes.contents && nextRes.contents.twoColumnWatchNextResults && nextRes.contents.twoColumnWatchNextResults.results && nextRes.contents.twoColumnWatchNextResults.results.results && nextRes.contents.twoColumnWatchNextResults.results.results.contents;
    if (!contents || !contents.length) return "";
    var i = 0;
    for (i = 0; i < contents.length; i++) {
        var isr = contents[i] && contents[i].itemSectionRenderer;
        if (!isr || !isr.contents) continue;
        if (isr.sectionIdentifier === "comment-item-section") {
            var tok = extractContinuationToken(isr.contents);
            if (tok) return tok;
        }
    }
    for (i = 0; i < contents.length; i++) {
        var isr2 = contents[i] && contents[i].itemSectionRenderer;
        if (isr2 && isr2.contents) {
            var tok2 = extractContinuationToken(isr2.contents);
            if (tok2) return tok2;
        }
    }
    return "";
}

function parseInnerTubeComments(res) {
    var items = [];
    var nextToken = "";
    if (!res) return { items: items, next: nextToken };

    var entityMap = {};
    var mutations = res.frameworkUpdates && res.frameworkUpdates.entityBatchUpdate && res.frameworkUpdates.entityBatchUpdate.mutations;
    var i = 0;
    if (mutations && mutations.length) {
        for (i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            var cep = m && m.payload && m.payload.commentEntityPayload;
            if (cep && cep.properties && cep.properties.commentId) {
                entityMap[String(cep.properties.commentId)] = cep;
            }
        }
    }

    var endpoints = res.onResponseReceivedEndpoints || [];
    for (i = 0; i < endpoints.length; i++) {
        var ep = endpoints[i];
        var contItems = null;
        if (ep.reloadContinuationItemsCommand && ep.reloadContinuationItemsCommand.continuationItems) {
            contItems = ep.reloadContinuationItemsCommand.continuationItems;
        } else if (ep.appendContinuationItemsAction && ep.appendContinuationItemsAction.continuationItems) {
            contItems = ep.appendContinuationItemsAction.continuationItems;
        }
        if (!contItems || !contItems.length) continue;

        var j = 0;
        for (j = 0; j < contItems.length; j++) {
            var ci = contItems[j];
            if (!ci) continue;
            if (ci.commentThreadRenderer) {
                var ctr = ci.commentThreadRenderer;
                var cr = ctr.comment && ctr.comment.commentRenderer;
                var cvm = ctr.commentViewModel && ctr.commentViewModel.commentViewModel;
                if (cvm && cvm.commentKey && entityMap[cvm.commentKey]) {
                    var ent = entityMap[cvm.commentKey];
                    var author = ent.author || {};
                    var props = ent.properties || {};
                    var tb = ent.toolbar || {};
                    var cText = props.content && props.content.content ? cleanText(props.content.content) : "";
                    if (cText) {
                        items.push({
                            name: cleanText(author.displayName || "YouTube User"),
                            content: cText,
                            avatar: author.avatarThumbnailUrl ? String(author.avatarThumbnailUrl) : "",
                            description: buildCommentDesc(props.publishedTime || "", tb.likeCountNotliked || tb.likeCountLiked || "", tb.replyCount || 0)
                        });
                    }
                } else if (cr) {
                    var text = getRunsText(cr.contentText);
                    if (text) {
                        items.push({
                            name: getRunsText(cr.authorText) || "YouTube User",
                            content: text,
                            avatar: pickBestThumb(cr.authorThumbnail && cr.authorThumbnail.thumbnails, ""),
                            description: buildCommentDesc(getRunsText(cr.publishedTimeText), getRunsText(cr.voteCount), cr.replyCount || 0)
                        });
                    }
                }
            } else if (ci.continuationItemRenderer) {
                var tok = extractContinuationToken([ci]);
                if (tok) nextToken = tok;
            }
        }
    }

    return { items: items, next: nextToken };
}

function parsePipedComments(data, vid) {
    var items = [];
    var arr = (data && data.comments) || [];
    var i = 0;
    for (i = 0; i < arr.length; i++) {
        var c = arr[i];
        if (!c || !c.commentText) continue;
        items.push({
            name: cleanText(c.author || "YouTube User"),
            content: cleanText(c.commentText),
            avatar: c.thumbnail ? String(c.thumbnail) : "",
            description: buildCommentDesc(c.commentedTime || "", c.likeCount || "", c.repliesCount || 0)
        });
    }
    var next = data && data.nextpage ? ("piped:" + vid + "|" + String(data.nextpage)) : "";
    return { items: items, next: next };
}

function parseInvidiousComments(data, vid) {
    var items = [];
    var arr = (data && data.comments) || [];
    var i = 0;
    for (i = 0; i < arr.length; i++) {
        var c = arr[i];
        if (!c || !c.content) continue;
        var av = "";
        if (c.authorThumbnails && c.authorThumbnails.length > 0) {
            av = String(c.authorThumbnails[c.authorThumbnails.length - 1].url || "");
        }
        var repCount = c.replies && c.replies.replyCount ? c.replies.replyCount : 0;
        items.push({
            name: cleanText(c.author || "YouTube User"),
            content: cleanText(c.content),
            avatar: av,
            description: buildCommentDesc(c.publishedText || "", c.likeCount || "", repCount)
        });
    }
    var next = data && data.continuation ? ("inv:" + vid + "|" + String(data.continuation)) : "";
    return { items: items, next: next };
}

function fetchPipedCommentsPage(vid, nextPage) {
    var custom = getCustomMirrors();
    var pipedList = custom.concat(PIPED_INSTANCES);
    var ep = "/comments/" + vid + (nextPage ? ("?nextpage=" + encodeURIComponent(nextPage)) : "");
    var i = 0;
    for (i = 0; i < pipedList.length; i++) {
        var j = fetchJsonSafe(pipedList[i] + ep, 6000);
        if (j && j.comments) return parsePipedComments(j, vid);
    }
    return null;
}

function fetchInvidiousCommentsPage(vid, cont) {
    var ep = "/api/v1/comments/" + vid + (cont ? ("?continuation=" + encodeURIComponent(cont)) : "");
    var i = 0;
    for (i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
        var j = fetchJsonSafe(INVIDIOUS_INSTANCES[i] + ep, 6000);
        if (j && j.comments) return parseInvidiousComments(j, vid);
    }
    return null;
}

function execute(input, page) {
    page = page ? String(page).trim() : "";

    if (page.indexOf("piped:") === 0) {
        var pRest = page.substring(6);
        var pSep = pRest.indexOf("|");
        if (pSep !== -1) {
            var pRes = fetchPipedCommentsPage(pRest.substring(0, pSep), pRest.substring(pSep + 1));
            if (pRes) return Response.success(pRes.items, pRes.next);
        }
        return Response.error("Không tải được trang bình luận Piped tiếp theo");
    }
    if (page.indexOf("inv:") === 0) {
        var iRest = page.substring(4);
        var iSep = iRest.indexOf("|");
        if (iSep !== -1) {
            var iRes = fetchInvidiousCommentsPage(iRest.substring(0, iSep), iRest.substring(iSep + 1));
            if (iRes) return Response.success(iRes.items, iRes.next);
        }
        return Response.error("Không tải được trang bình luận Invidious tiếp theo");
    }

    if (page) {
        var contRes = requestInnerTube("next", { continuation: page }, "WEB");
        if (!contRes) return Response.error("Không tải được trang bình luận tiếp theo");
        var parsedCont = parseInnerTubeComments(contRes);
        return Response.success(parsedCont.items, parsedCont.next);
    }

    var url = normYtUrl(input);
    var vid = extractVideoId(url);
    if (!vid) {
        var listId = extractPlaylistId(url);
        if (listId) vid = resolveFirstPlaylistVideo(listId);
    }
    if (!vid) return Response.error("Không xác định được video để tải bình luận: " + input);

    var nextRes = requestInnerTube("next", { videoId: vid }, "WEB");
    if (nextRes) {
        var cTok = findCommentSectionToken(nextRes);
        if (cTok) {
            var cRes = requestInnerTube("next", { continuation: cTok }, "WEB");
            var parsed = parseInnerTubeComments(cRes);
            if (parsed.items.length > 0) {
                return Response.success(parsed.items, parsed.next);
            }
        }
    }

    var apiRes = requestApi("/comments/" + vid, { timeoutMs: 6000 });
    if (apiRes && apiRes.data) {
        if (apiRes.tier === "piped") {
            var pParsed = parsePipedComments(apiRes.data, vid);
            return Response.success(pParsed.items, pParsed.next);
        }
        if (apiRes.tier === "invidious") {
            var iParsed = parseInvidiousComments(apiRes.data, vid);
            return Response.success(iParsed.items, iParsed.next);
        }
    }

    return Response.success([], "");
}
