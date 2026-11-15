// search.js — Cứu Truyện: tìm kiếm qua /api/v2/mangas/quick_search?q=.
// Tìm được cả có dấu và không dấu (đã xác minh từ VM: "one punch" và
// "one" đều trả One-Punch Man). Không phân trang.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    var q = String(query || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện.");
    var result = fetchJson(BASE_URL + "/api/v2/mangas/quick_search?q=" + encodeURIComponent(q));
    if (!result.ok || !result.data) {
        return Response.error(apiErrorMessage(result, "kết quả tìm kiếm"));
    }
    var raw = result.data.data;
    if (!Array.isArray(raw)) {
        return Response.error("Không đọc được kết quả tìm kiếm (site có thể đã đổi giao diện).");
    }
    var items = [];
    for (var i = 0; i < raw.length; i++) {
        var item = mangaToItem(raw[i]);
        if (item && item.name) items.push(item);
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào với từ khóa \"" + q + "\".");
    }
    return Response.success(items);
}
