// comment.js — Doc binh luan truyen tren SangtacvietApp
// Khai thac API noi bo /mobile/comment.php?act=readcomment
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load('config.js');
load('rate-limit.js');
load('challenge-handler.js');

function parseCommentInput(input) {
    var hostId = "";
    var bookId = "";
    var str = String(input || "").trim();

    var m = str.match(/truyen\/([^\/]+)\/\d+\/([^\/?#]+)/);
    if (m) {
        hostId = m[1];
        bookId = m[2];
    } else {
        var parts = str.split("/");
        if (parts.length >= 2) {
            hostId = parts[0];
            bookId = parts[1];
        }
    }

    return { host: hostId, bookid: bookId };
}

function cleanCommentText(raw) {
    if (!raw) return "";
    var text = String(raw);

    // Xoa the icon font-awesome
    text = text.replace(/<i\b[^>]*>[\s\S]*?<\/i>/gi, "");

    // Xoa the tag nguoi dung @User
    text = text.replace(/<span[^>]*class=['"][^'"]*t-gray[^'"]*['"][^>]*>@?([^<]*)<\/span>/gi, "@$1");

    // Dinh dang xuong dong
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Loai bo the HTML khong can thiet nhung giu lai the link text
    text = text.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
    text = text.replace(/<[^>]+>/g, "");

    // Chuan hoa khoang trang
    text = text.replace(/^\s+|\s+$/g, "");
    text = text.replace(/\n{3,}/g, "\n\n");

    return text;
}

function execute(input, page) {
    var parsed = parseCommentInput(input);
    var hostId = parsed.host;
    var bookId = parsed.bookid;

    if (!hostId || !bookId) {
        return Response.error("Không xác định được ID truyện để tải bình luận: " + input);
    }

    var pageNum = 1;
    if (page) {
        var parsedPage = parseInt(page, 10);
        if (!isNaN(parsedPage) && parsedPage > 0) {
            pageNum = parsedPage;
        }
    }

    var start = (pageNum - 1) * 10;
    if (start < 0) start = 0;

    var commentUrl = BASE_URL + "/mobile/comment.php?act=readcomment&host=" + encodeURIComponent(hostId)
        + "&bookid=" + encodeURIComponent(bookId)
        + "&start=" + start
        + "&order=new";

    var res = null;
    var rawText = "";
    try {
        res = fetchWithMirrors(commentUrl, {
            method: "GET",
            headers: {
                "x-stv-transport": "app",
                "x-requested-with": "com.sangtacviet.mobilereader"
            }
        });
        if (res) rawText = String(res.text() || "");
    } catch (e) {
        return Response.error("Không kết nối được tới máy chủ bình luận Sáng Tác Việt: " + e);
    }

    if (!res || !res.ok) {
        var blockedMsg = stvBlockedMessage();
        if (blockedMsg) return Response.error(blockedMsg);
        if (isCloudflareChallenge(rawText, res ? res.headers : null)) {
            return Response.error(formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + hostId + "/1/" + bookId + "/"));
        }
        return Response.error("Không tải được bình luận (HTTP " + (res ? res.status : 0) + ")");
    }

    if (isCloudflareChallenge(rawText, res ? res.headers : null)) {
        return Response.error(formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + hostId + "/1/" + bookId + "/"));
    }

    var json = null;
    try {
        json = JSON.parse(rawText);
    } catch (eJson) {
        return Response.error("Dữ liệu bình luận không đúng định dạng JSON: " + rawText.substring(0, 80));
    }

    if (!json || json.code !== 100 || !json.list) {
        return Response.success([], "");
    }

    var rawList = json.list;
    var comments = [];

    for (var i = 0; i < rawList.length; i++) {
        var c = rawList[i];
        if (!c) continue;

        var authorName = (c.name || "Ẩn danh").trim();
        var danhhao = (c.danhhao || "").trim();
        var displayName = authorName;
        if (danhhao) {
            displayName = displayName + " [" + danhhao + "]";
        }

        var avatarUrl = c.avatar || "";
        if (avatarUrl && avatarUrl.indexOf("//") === 0) {
            avatarUrl = "https:" + avatarUrl;
        }

        var contentText = cleanCommentText(c.content || "");

        // Xu ly cac cau tra loi (reply) kem theo
        if (c.reply && c.reply.length > 0) {
            for (var r = 0; r < c.reply.length; r++) {
                var rep = c.reply[r];
                if (!rep) continue;
                var repName = (rep.name || "Ẩn danh").trim();
                var repDanhhao = (rep.danhhao || "").trim();
                var repHeader = repName + (repDanhhao ? " [" + repDanhhao + "]" : "");
                var repContent = cleanCommentText(rep.content || "");
                contentText += "\n\n  ↳ 💬 " + repHeader + ": " + repContent;
            }
        }

        comments.push({
            name: displayName,
            content: contentText,
            avatar: avatarUrl,
            description: c.time || ""
        });
    }

    var nextPage = "";
    if (rawList.length >= 10) {
        nextPage = String(pageNum + 1);
    }

    return Response.success(comments, nextPage);
}
