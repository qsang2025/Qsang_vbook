// comment.js — Binh luan truyen: GET /api/comments/books/<slug>?
// sort=-_id&limit=20&next=<token>.
// Tra loi cua 1 binh luan lay qua ?parent=<id>&limit=10 (kiem chung:
// Đế Bá co 1 binh luan "2225", next null, options.counts).
// Dinh dang binh luan chuan vBook: {name, content, avatar, description}.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var DEFAULT_AVATAR = "https://cdn.tienvuc.link/static/images/no-img-user.jpg";
var PAGE_LIMIT = 20;

function execute(input, page) {
    var url = normalizeUrl(input);
    if (!url) return Response.success([], "");
    var slug = slugOf(url);
    if (!slug) return Response.success([], "");

    // 1. Binh luan cap 1.
    var apiPath = "/api/comments/books/" + encodeURIComponent(slug) + "?sort=-_id&limit=" + PAGE_LIMIT;
    if (page && String(page).trim() !== "") {
        apiPath += "&next=" + encodeURIComponent(String(page).trim());
    }
    var r = fetchTvApi(apiPath);
    if (r.error) return Response.success([], "");

    var json = r.json || {};
    var docs = json.docs || json.data || [];
    if (!docs || docs.length === undefined) return Response.success([], "");
    var replyCounts = (json.options && json.options.counts) ? json.options.counts : {};

    var comments = [];
    for (var i = 0; i < docs.length; i++) {
        var item = docs[i];
        var parsed = parseComment(item, false);
        if (!parsed) continue;
        comments.push(parsed);

        // 2. Neu co tra loi thi goi API lay danh sach tra loi cua binh luan do.
        var commentId = item.id || item._id;
        var hasReplies = false;
        if (commentId && replyCounts[commentId] && replyCounts[commentId] > 0) {
            hasReplies = true;
        } else if (item.childrenCount && item.childrenCount > 0) {
            hasReplies = true;
        }
        if (hasReplies && commentId) {
            var childPath = "/api/comments/books/" + encodeURIComponent(slug) + "?parent=" + encodeURIComponent(commentId) + "&limit=10";
            var cr = fetchTvApi(childPath);
            if (!cr.error && cr.json) {
                var childDocs = cr.json.docs || cr.json.data || [];
                if (childDocs && childDocs.length !== undefined) {
                    for (var j = 0; j < childDocs.length; j++) {
                        var childParsed = parseComment(childDocs[j], true);
                        if (childParsed) comments.push(childParsed);
                    }
                }
            }
        }
    }

    var nextPage = "";
    if (json.next && comments.length > 0) nextPage = String(json.next);
    return Response.success(comments, nextPage);
}

function parseComment(item, isReply) {
    if (!item) return null;
    var user = item.user || item.createdBy || item.donor || item.author || {};
    var name = "Ẩn danh";
    var avatar = DEFAULT_AVATAR;
    if (typeof user === "string") {
        name = user;
    } else if (user) {
        name = user.displayName || user.name || user.username || "Ẩn danh";
        if (user.avatar) avatar = normalizeUrl(user.avatar);
    }

    var content = cleanText(item.content || item.message || item.text || item.comment || "");
    if (item.coins) {
        if (content) {
            content += " (Ủng hộ " + item.coins + " xu)";
        } else {
            content = "Ủng hộ " + item.coins + " xu";
        }
    }
    if (!content) return null;

    var time = "Vừa xong";
    if (item.createdAt) {
        time = cleanText(String(item.createdAt).split("T")[0]);
    } else if (item.created_at) {
        time = cleanText(String(item.created_at).split("T")[0]);
    }

    return {
        name: (isReply ? "↳ " : "") + name,
        content: content,
        avatar: avatar,
        description: time
    };
}
