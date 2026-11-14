// search.js — tim kiem theo tieu de qua API JSON cua site.
// GET /api/search?keyword=<tu khoa>&page=<trang>, 24 ket qua/trang.
// Kiem chung live 2026-11-14: "高考" ra 5 ket qua, "剑来" ra 1 ket qua.
//
// Load: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm truyện");

    rateLimitDelay("banshanren.com");
    var response = fetch(BASE_URL + "/api/search", {
        queries: { keyword: query, page: page }
    });
    if (!response.ok) return Response.error("Không tìm được truyện (HTTP " + response.status + ")");

    var model = response.json().model;
    if (!model) return Response.success([]);

    var data = model.data || [];
    var items = [];
    for (var i = 0; i < data.length; i++) {
        var item = apiItem(data[i]);
        if (item.name) items.push(item);
    }

    var current = parseInt(model.currentPage, 10) || 1;
    var total = parseInt(model.totalPage, 10) || 1;
    return Response.success(items, current < total ? String(current + 1) : "");
}
