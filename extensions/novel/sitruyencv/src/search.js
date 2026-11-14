// search.js — Tim kiem qua POST /api/stories/search, body {keyword}.
// LUU Y: API tim kiem CHI CO DAU — go khong dau tra 0 ket qua
// (kiem chung tu VM: "doan tau" -> 0, "đoàn tàu" -> dung truyen).
// Ghi ro trong mo ta nguon; khong tu dong them dau (khong co bang chuyen doi).
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    var q = String(key || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện (gõ có dấu)");
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;
    var rr = stvFetchJson(API_URL + "/api/stories/search?page=" + p + "&limit=24", {
        method: "POST",
        body: JSON.stringify({ keyword: q })
    });
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.data) return Response.success([], "");
    var list = [];
    if (json.data.items) list = json.data.items;
    else if (json.data instanceof Array) list = json.data;
    var data = [];
    for (var i = 0; i < list.length; i++) {
        var item = mapStory(list[i]);
        if (item) data.push(item);
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy truyện nào với từ khóa này (thử gõ có dấu)");
    }
    var next = "";
    var meta = json.data.metadata;
    if (meta && meta.current_page < meta.total_pages) {
        next = String(meta.current_page + 1);
    } else if (list.length >= 24) {
        next = String(p + 1);
    }
    return Response.success(data, next);
}
