// comment.js — Lay danh sach binh luan cua video tren Dailymotion
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute(input, page) {
    if (!input || !String(input).trim()) {
        return Response.error("Thiếu thông tin video để tải bình luận.");
    }
    input = String(input).trim();
    var id = videoIdFromUrl(input) || input;
    if (!id) return Response.error("Không đọc được ID video: " + input);

    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var apiUrl = API_BASE + "/video/" + id + "/comments?fields=id,message,created_time,owner.screenname,owner.avatar_120_url&page=" + p + "&limit=20";
    var res = dmApiGet(apiUrl);
    if (!res || !(res.list instanceof Array)) {
        return Response.success([], null);
    }

    var comments = [];
    for (var i = 0; i < res.list.length; i++) {
        var item = res.list[i];
        if (!item) continue;
        var name = item["owner.screenname"] || "Thành viên";
        var avatar = item["owner.avatar_120_url"] || "";
        var content = item.message || "";
        var dateStr = "";
        if (item.created_time) {
            try {
                var d = new Date(parseInt(item.created_time, 10) * 1000);
                dateStr = d.toISOString().substring(0, 10);
            } catch (e) {
                dateStr = "";
            }
        }
        comments.push({
            name: name,
            content: content,
            avatar: avatar,
            description: dateStr
        });
    }

    var nextPage = res.has_more ? String(p + 1) : null;
    return Response.success(comments, nextPage);
}
