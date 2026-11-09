// comment.js — Lay danh sach binh luan tren La Ca Truyen qua /api/stories/get-comments
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function resolveStoryIdFromUrl(url) {
    if (!url) return 0;
    if (/^\d+$/.test(String(url).trim())) {
        return parseInt(String(url).trim(), 10);
    }
    var storyUrl = stripQueryAndHash(normalizeUrl(url)).replace(/\/+$/, "");
    try {
        var res = fetch(storyUrl, {
            method: "GET",
            headers: buildAuthHeaders()
        });
        if (res && res.ok) {
            var rawHtml = String(res.text() || "");
            var nextData = rawHtml ? extractNextData(rawHtml) : null;
            if (nextData && nextData.props && nextData.props.pageProps && nextData.props.pageProps.story) {
                return parseInt(nextData.props.pageProps.story.id || 0, 10);
            }
        }
    } catch (e) {}
    return 0;
}

function execute(input, page) {
    if (!input || !String(input).trim()) {
        return Response.error("Thiếu thông tin truyện để tải bình luận.");
    }
    input = String(input).trim();

    var storyId = 0;
    if (/^\d+$/.test(input)) {
        storyId = parseInt(input, 10);
    } else {
        storyId = resolveStoryIdFromUrl(input);
    }

    if (!storyId) {
        return Response.error("Không tìm thấy mã truyện để tải bình luận.");
    }

    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var headers = buildAuthHeaders();
    headers["Content-Type"] = "application/json";

    var payload = JSON.stringify({
        story_id: storyId,
        page: p,
        items_per_page: 10,
        sort: "newest"
    });

    var res = null;
    try {
        res = fetch(BASE_URL + "/api/stories/get-comments", {
            method: "POST",
            headers: headers,
            body: payload
        });
    } catch (e) {
        return Response.error("Lỗi kết nối khi tải bình luận: " + e);
    }

    if (!res || !res.ok) {
        return Response.error("Không thể tải bình luận (HTTP " + (res ? res.status : 0) + ").");
    }

    var json = null;
    try {
        json = res.json();
    } catch (e2) {
        try {
            json = JSON.parse(String(res.text() || ""));
        } catch (e3) {
            return Response.error("Lỗi đọc dữ liệu bình luận.");
        }
    }

    if (!json || json.message !== "success") {
        return Response.error("Không thể tải bình luận truyện.");
    }

    var list = json.data || [];
    var comments = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item) continue;

        var name = item.pen_name_user || item.name_user || "Thành viên";
        var avatar = item.image_user || "";
        if (avatar && avatar.indexOf("//") === 0) avatar = "https:" + avatar;

        var content = item.content || "";
        var desc = item.created_at || "";
        if (item.chapter_title) {
            desc += (desc ? " • " : "") + item.chapter_title;
        }
        if (item.like_count && item.like_count > 0) {
            desc += (desc ? " • " : "") + item.like_count + " thích";
        }

        comments.push({
            name: name,
            content: content,
            avatar: avatar,
            description: desc
        });
    }

    var nextPage = null;
    var totalCount = parseInt(json.count || 0, 10);
    if (!isNaN(totalCount) && p * 10 < totalCount) {
        nextPage = String(p + 1);
    }

    return Response.success(comments, nextPage);
}
