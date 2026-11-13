// comment.js — Binh luan cua truyen:
// GET /api/comments/novel/<id>?sort=newest&page=N&limit=10.
// Chu y: truong noi dung la "text" (HTML), KHONG phai "content"
// (base cu dung sai truong nay). Bo binh luan da xoa.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(novelId, page) {
    var p = 1;
    if (page) {
        p = parseInt(page, 10);
        if (isNaN(p) || p < 1) p = 1;
    }
    var r = fetchApiJson("/api/comments/novel/" + novelId + "?sort=newest&page=" + p + "&limit=10&hideChapterComments=false");
    if (r.error) return Response.error(r.error);
    var data = r.data || {};
    var comments = data.comments || [];
    var items = [];
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i];
        if (c.isDeleted || c.adminDeleted) continue;
        var txt = stripHtml(c.text || "");
        if (!txt) continue;
        var user = (c.user && c.user.displayName) ? c.user.displayName : "Ẩn danh";
        items.push({
            name: user,
            content: txt,
            description: c.createdAt ? String(c.createdAt).substring(0, 10) : ""
        });
    }
    var pg = data.pagination || {};
    var next = pg.hasNext ? String(p + 1) : "";
    return Response.success(items, next);
}
