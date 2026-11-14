// genrecontent.js — Danh sach truyen theo the loai: API
// /novel/list?sortid=<id>&page=<p>&limit=20 (20 truyen/trang).
load("config.js");
load("rate-limit.js");
function execute(sortid, page) {
    var sort = String(sortid || "").trim();
    var genreId = parseInt(sort, 10);
    if (!/^\d+$/.test(sort) || genreId < 1 || genreId > 36) {
        return Response.error("ID thể loại không hợp lệ");
    }

    var pageValue = String(page || "1").trim();
    if (!/^\d+$/.test(pageValue) || parseInt(pageValue, 10) < 1) {
        return Response.error("Trang không hợp lệ");
    }

    var p = parseInt(pageValue, 10);
    var r = fetchApi("/novel/list?sortid=" + genreId + "&page=" + p + "&limit=20", true);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tải danh sách thất bại");

    var d = json.data;
    if (!d) return Response.error("Không có dữ liệu");

    var items = d.data || d.items;
    if (!items || !items.length) return Response.error("Không có dữ liệu thể loại");

    var next = d.next_page ? String(p + 1) : "";
    return Response.success(buildItems(items), next);
}
