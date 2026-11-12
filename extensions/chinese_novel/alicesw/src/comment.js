// comment.js — binh luan truyen alicesw.
// Luong 2 buoc (kiem chung live 2026-11-12):
//   1. GET trang lists: lay `var trre=[{id,mid,type}...],page_num=N,
//      count=M,type="novel"` — trre chi la danh sach id binh luan,
//      KHONG co noi dung (ban goc doc sai cho nay nen tra binh luan rong).
//   2. POST tung chunk (toi da page_num id) toi
//      /index.php?s=home/comment/tree, form {tree, page, limit, count,
//      type} — server tra HTML ul#post-list > li.post co username,
//      avatar, noi dung (.post-message), thoi gian (.time-ago), luot
//      thich (.action.zan span). Reply long nhau nam trong ul.children.
// Phan trang qua next token = so trang (mac dinh "1").
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function parseOnePost(li) {
    var userEl = safeFirst(li.select(".username"));
    var name = userEl ? cleanText(userEl.text()) : "匿名";
    var avatarEl = safeFirst(li.select(".avatar img"));
    var avatar = "";
    if (avatarEl) {
        avatar = avatarEl.attr("src");
        if (avatar && avatar.indexOf("http") !== 0) avatar = BASE_URL + avatar;
    }
    var msgEl = safeFirst(li.select(".post-message"));
    var content = msgEl ? cleanText(msgEl.text()) : "";
    var timeEl = safeFirst(li.select(".time-ago"));
    var likeEl = safeFirst(li.select(".action.zan span"));
    var parts = [];
    if (timeEl && timeEl.text()) parts.push(timeEl.text().trim());
    if (likeEl && likeEl.text() && likeEl.text().trim() !== "0") parts.push("赞: " + likeEl.text().trim());
    return {
        name: name,
        avatar: avatar,
        content: content,
        description: parts.join(" · ")
    };
}

function execute(input, next) {
    if (!next) next = "1";
    var page = parseInt(next, 10);
    if (!page || page < 1) page = 1;

    var response = fetchPage(input);
    if (!response.ok) return Response.error("Không tải được bình luận (HTTP " + response.status + ")");
    var text = response.text() + "";
    var match = text.match(/var trre=(\[[\s\S]*?\]),page_num=(\d+),count=(\d+),mold="[^"]*",type="([^"]*)"/);
    if (!match) return Response.success([], "");
    var list;
    try {
        list = JSON.parse(match[1]);
    } catch (e) {
        return Response.error("Không đọc được danh sách bình luận");
    }
    var pageSize = parseInt(match[2], 10) || 5;
    var count = parseInt(match[3], 10) || 0;
    var type = match[4] || "novel";
    if (!list || list.length === 0 || count === 0) return Response.success([], "");

    var start = (page - 1) * pageSize;
    if (start >= list.length) return Response.success([], "");
    var chunk = list.slice(start, start + pageSize);

    var body = "tree=" + encodeURIComponent(JSON.stringify(chunk))
        + "&page=" + page
        + "&limit=" + pageSize
        + "&count=" + count
        + "&type=" + encodeURIComponent(type);
    var treeRes = fetchPage(BASE_URL + "/index.php?s=home/comment/tree", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": input
        },
        body: body
    });
    if (!treeRes.ok) return Response.error("Không tải được bình luận (HTTP " + treeRes.status + ")");
    var doc = treeRes.html();
    var data = [];
    var posts = doc.select("ul#post-list > li.post");
    for (var i = 0; i < posts.size(); i++) {
        var li = posts.get(i);
        var comment = parseOnePost(li);
        var replies = [];
        var children = li.select("ul.children > li.post");
        for (var j = 0; j < children.size(); j++) {
            replies.push(parseOnePost(children.get(j)));
        }
        comment.replies = replies;
        data.push(comment);
    }
    var nextToken = "";
    if (start + pageSize < list.length) nextToken = (page + 1).toString();
    return Response.success(data, nextToken);
}
