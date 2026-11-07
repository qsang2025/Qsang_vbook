// search.js — Tim kiem truyen Tiem Truyen Chu qua Public API v1
load('config.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.success([], "");
    }
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var q = encodeURIComponent(String(key).trim());
    var apiUrl = BASE_URL + "/api/v1/stories?keyword=" + q + "&page=" + p + "&limit=30";

    var json = fetchJson(apiUrl);
    if (!json || !json.items) {
        return Response.error("Không thể tìm kiếm truyện trên Tiệm Truyện Chữ.");
    }

    var list = [];
    for (var i = 0; i < json.items.length; i++) {
        var it = json.items[i];
        if (!it || !it.id) continue;
        var cover = it.cover_url || it.poster || "";
        if (cover && cover.indexOf("http") !== 0) {
            cover = BASE_URL + (cover.charAt(0) === "/" ? "" : "/") + cover;
        }
        var author = it.author || "Không rõ";
        var chapInfo = it.latest_chapter_title || (it.total_chapters ? (it.total_chapters + " chương") : "");
        var desc = author;
        if (chapInfo) {
            desc = desc ? (desc + " • " + chapInfo) : chapInfo;
        }
        list.push({
            name: it.title || ("Truyện #" + it.id),
            link: BASE_URL + "/truyen/" + it.id,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    }

    var totalPages = json.totalPages ? parseInt(json.totalPages, 10) : 1;
    var next = (p < totalPages && list.length > 0) ? String(p + 1) : "";
    return Response.success(list, next);
}
