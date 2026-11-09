// comment.js — Lay danh sach binh luan tren Tiem Truyen Chu qua /api/v1/stories/{id}/comments
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(input, page) {
    if (!input || !String(input).trim()) {
        return Response.error("Thiếu thông tin truyện để tải bình luận.");
    }
    input = String(input).trim();
    var storyId = resolveStoryId(input);
    if (!storyId) {
        if (/^\d+$/.test(input)) {
            storyId = input;
        } else {
            return Response.error("Không tìm thấy mã truyện: " + input);
        }
    }

    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var apiUrl = BASE_URL + "/api/v1/stories/" + storyId + "/comments?page=" + p;
    var json = fetchJson(apiUrl);
    if (!json || !json.success) {
        return Response.error("Không thể tải danh sách bình luận.");
    }

    var items = json.items || [];
    var comments = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item) continue;
        var name = item.display_name || item.username || "Thành viên";
        var avatar = item.avatar || "";
        if (avatar && avatar.indexOf("http") !== 0) {
            avatar = BASE_URL + (avatar.charAt(0) === "/" ? "" : "/") + avatar;
        }
        var desc = item.created_at ? item.created_at.substring(0, 10) : "";
        if (item.likes && item.likes > 0) {
            desc += (desc ? " • " : "") + item.likes + " thích";
        }
        var content = item.content || "";
        if (item.replies && item.replies.length > 0) {
            for (var r = 0; r < item.replies.length; r++) {
                var rep = item.replies[r];
                var rName = rep.display_name || rep.username || "Thành viên";
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
    var totalPages = json.totalPages || (json.total ? Math.ceil(json.total / 10) : 1);
    if (p < totalPages) {
        nextPage = String(p + 1);
    }

    return Response.success(comments, nextPage);
}
