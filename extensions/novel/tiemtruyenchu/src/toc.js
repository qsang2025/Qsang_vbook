// toc.js — Danh sach chuong Tiem Truyen Chu (HTML da login hoac sinh tu Public API v1)
load('config.js');

function execute(url) {
    var storyId = extractStoryId(url);
    if (!storyId) {
        return Response.error("Không xác định được mã truyện để lấy mục lục.");
    }

    var list = [];
    var ck = getSavedCookie();

    // 1. Neu co Cookie, thu tai trang HTML de lay ten chuong day du trong #chapter-list-container
    if (ck) {
        var pageUrl = BASE_URL + "/truyen/" + storyId;
        var res = fetch(pageUrl, { headers: buildHeaders(ck) });
        if (res && res.ok) {
            var doc = res.html();
            var links = doc.select("#chapter-list-container a[href*='/doc-truyen/']");
            for (var i = 0; i < links.size(); i++) {
                var a = links.get(i);
                var href = a.attr("href");
                var title = a.text().trim();
                if (href) {
                    list.push({
                        name: title || ("Chương " + (i + 1)),
                        url: normalizeUrl(href),
                        host: BASE_URL
                    });
                }
            }
            if (list.length > 0) {
                return Response.success(list);
            }
        }
    }

    // 2. Goi Public API v1 /api/v1/stories/<id> (khong can dang nhap)
    var apiUrl = BASE_URL + "/api/v1/stories/" + storyId;
    var json = fetchJson(apiUrl);
    var story = null;
    if (json) {
        if (json.story && json.story.id) {
            story = json.story;
        } else if (json.data && json.data.id) {
            story = json.data;
        } else if (json.id) {
            story = json;
        }
    }

    if (story && story.chapters && story.chapters.length) {
        for (var j = 0; j < story.chapters.length; j++) {
            var ch = story.chapters[j];
            var num = ch.chapter_number || ch.number || (j + 1);
            var chTitle = ch.title || ("Chương " + num);
            list.push({
                name: chTitle,
                url: BASE_URL + "/doc-truyen/" + storyId + "/chuong/" + num,
                host: BASE_URL
            });
        }
        return Response.success(list);
    }

    var total = story && story.total_chapters ? parseInt(story.total_chapters, 10) : 0;
    if (total > 0) {
        var latestTitle = story.latest_chapter_title ? String(story.latest_chapter_title).trim() : "";
        for (var k = 1; k <= total; k++) {
            var chapName = "Chương " + k;
            if (k === total && latestTitle) {
                chapName = latestTitle;
            }
            list.push({
                name: chapName,
                url: BASE_URL + "/doc-truyen/" + storyId + "/chuong/" + k,
                host: BASE_URL
            });
        }
        return Response.success(list);
    }

    return Response.error("Không thể tải danh sách chương cho truyện #" + storyId + ".");
}
