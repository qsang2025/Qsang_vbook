// search.js — Tim kiem qua API (execute(query, page) -> items).
// POST /api/search {text: query} tra {success, data:[serie...]} — cung
// dang serie nhu danh sach (raw_id/id + slug + data.title/image).
// Tim kiem cua site chi tra 1 trang (10 ket qua, khong co phan trang)
// nen data2 luon "".
// QUIRK: POST nay TREO tu VM (tarpit IP datacenter) nhung chay tot tren
// may that (probe 2026-11-16 ~09:05: success=true, 10 ket qua, sach
// mau dung dau). Khong retry — cho lau vo ich.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query).trim();
    if (!query) return Response.error("Nhập từ khóa để tìm truyện.");
    var r = postWtrJson(BASE_URL + "/api/search", { text: query }, 20000);
    if (r.error) return Response.error(r.error);
    var j = r.json;
    if (j && j.success === false) {
        return Response.error("Tìm kiếm thất bại" + (j.error ? ": " + j.error : "."));
    }
    var data = (j && j.data) || null;
    if (!data || !(data instanceof Array)) {
        return Response.error("Tìm kiếm thất bại.");
    }
    var items = [];
    var i = 0;
    for (i = 0; i < data.length; i++) {
        var one = parseSerieItem(data[i]);
        if (one !== null) items.push(one);
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào với từ khóa \"" + query + "\".");
    }
    return Response.success(items, "");
}
