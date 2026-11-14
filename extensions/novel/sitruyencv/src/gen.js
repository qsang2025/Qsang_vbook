// gen.js — Danh sach truyen theo tab trang chu / the loai / tag / loai.
// Goi POST /api/stories/search voi body JSON tuy theo URL input.
// Token trang ke la so trang tiep theo (chuoi), "" khi het.
load("config.js");
load("rate-limit.js");

function buildBody(url) {
    var body = { keyword: "" };
    if (!url) return body;
    var u = String(url);

    var cat = u.match(/\/category\/(\d+)/);
    if (cat) {
        body.category_ids = [parseInt(cat[1], 10)];
        return body;
    }
    var tag = u.match(/\/tag\/(\d+)/);
    if (tag) {
        body.tag_ids = [parseInt(tag[1], 10)];
        return body;
    }
    var type = u.match(/\/type\/([A-Za-z]+)/);
    if (type) {
        var t = type[1].toLowerCase();
        if (t === "convert") body.story_type = "Convert";
        else if (t === "dich" || t === "dichthuat") body.story_type = "Dịch";
        return body;
    }
    if (u.indexOf("completed") >= 0) {
        body.status = "Completed";
    } else if (u.indexOf("popular") >= 0) {
        body.sort_by = "Views";
    } else if (u.indexOf("updated") >= 0) {
        body.sort_by = "Updated";
    } else if (u.indexOf("recommended") >= 0) {
        body.sort_by = "Recommended";
    }
    return body;
}

function execute(url, page) {
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;
    var body = buildBody(url);
    var rr = stvFetchJson(API_URL + "/api/stories/search?page=" + p + "&limit=24", {
        method: "POST",
        body: JSON.stringify(body)
    });
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.data || !json.data.items) {
        return Response.success([], "");
    }
    var list = json.data.items;
    var data = [];
    for (var i = 0; i < list.length; i++) {
        var item = mapStory(list[i]);
        if (item) data.push(item);
    }
    if (data.length === 0) return Response.error("Không tìm thấy truyện nào trong mục này");
    var next = "";
    var meta = json.data.metadata;
    if (meta && meta.current_page < meta.total_pages) {
        next = String(meta.current_page + 1);
    }
    return Response.success(data, next);
}
