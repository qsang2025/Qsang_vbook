// search.js — Tim kiem: GET /api/novels/search?title=<tu khoa>.
// API tra mang truyen (khong phan trang); khong co tu khoa thi tra
// mang rong. Go co dau va khong dau deu duoc (kiem chung tu VM
// 2026-11-14: "sword" tra Danmachi, "trọng sinh" tra 1 ket qua).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(query, page) {
    var keyword = query;
    if (typeof query === "object" && query !== null && query.length !== undefined) {
        keyword = query[0];
        page = query[1];
    }
    var key = String(keyword || "").trim();
    if (!key) return Response.success([], "");

    var r = fetchApiJson("/api/novels/search?title=" + encodeURIComponent(key));
    if (r.error) return Response.error(r.error);
    var data = r.data;
    if (!data || !(data instanceof Array) || data.length === 0) {
        return Response.success([], "");
    }

    var items = [];
    for (var i = 0; i < data.length; i++) {
        var n = data[i];
        var desc = "";
        if (n.author) desc += "Tác giả: " + n.author;
        var st = mapStatus(n.status);
        if (st) desc += (desc ? " | " : "") + st;
        if (n.totalChapters) desc += (desc ? " | " : "") + n.totalChapters + " chương";
        items.push({
            name: n.title || "",
            cover: n.illustration || "",
            link: makeNovelUrl(n._id),
            host: BASE_URL,
            description: desc
        });
    }

    // Search API khong phan trang — khong co trang tiep.
    return Response.success(items, "");
}
