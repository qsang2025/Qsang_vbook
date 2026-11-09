// comment.js — Lay danh sach binh luan tren TruyenC qua API /api/comments
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');

function extractStoryIdFromHtml(html) {
    if (!html) return "";
    var m = html.match(/"storyId"\s*:\s*"([a-f0-9\-]{36})"/i);
    if (m) return m[1];
    return "";
}

function execute(input, page) {
    if (!input || !String(input).trim()) {
        return Response.error("Thiếu thông tin truyện để tải bình luận.");
    }
    input = String(input).trim();

    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var storyId = "";
    if (/^[0-9a-f\-]{36}$/i.test(input)) {
        storyId = input;
    } else {
        var url = normalizeUrl(input);
        var doc = fetchDocWithFallback(url, MIRROR_LIST);
        if (doc) {
            try {
                storyId = extractStoryIdFromHtml(doc.html());
            } catch (e) {
                storyId = "";
            }
        }
    }

    if (!storyId) {
        return Response.error("Không tìm thấy mã truyện để tải bình luận.");
    }

    var origins = [BASE_URL].concat(MIRROR_LIST);
    var resData = null;
    for (var i = 0; i < origins.length; i++) {
        var apiUrl = origins[i] + "/api/comments?target_type=story&target_id=" + storyId + "&sort=newest&page=" + p + "&limit=20";
        resData = fetchJson(apiUrl);
        if (resData) break;
    }

    if (!resData) {
        return Response.error("Không thể kết nối đến máy chủ bình luận.");
    }

    var list = resData.data || [];
    var comments = [];

    for (var j = 0; j < list.length; j++) {
        var item = list[j];
        if (!item) continue;

        var name = (item.user && (item.user.username || item.user.name)) || "Thành viên";
        var avatar = (item.user && item.user.avatar_url) || "";
        if (avatar.indexOf("//") === 0) avatar = "https:" + avatar;

        var content = item.content || "";
        var desc = item.created_at ? item.created_at.substring(0, 10) : "";
        if (item.likes_count && item.likes_count > 0) {
            desc += (desc ? " • " : "") + item.likes_count + " thích";
        }

        // Them cau tra loi (replies) neu co
        if (item.replies && item.replies.length > 0) {
            for (var r = 0; r < item.replies.length; r++) {
                var rep = item.replies[r];
                var rName = (rep.user && (rep.user.username || rep.user.name)) || "Thành viên";
                content += "\n↪ " + rName + ": " + (rep.content || "");
            }
        }

        comments.push({
            name: name,
            content: content,
            avatar: avatar,
            description: desc
        });
    }

    var nextPage = null;
    if (resData.meta && resData.meta.page < resData.meta.total_pages) {
        nextPage = String(resData.meta.page + 1);
    }

    return Response.success(comments, nextPage);
}
