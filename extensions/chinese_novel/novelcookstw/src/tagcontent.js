// tagcontent.js — Danh sach truyen theo tag: API
// /novel/keyword/<keyword_id>?page=<p>&limit=20 (20 truyen/trang).
load("config.js");
load("rate-limit.js");
function execute(tagId, page) {
    if (!tagId) return Response.error("Thiếu ID thể loại");
    var pageValue = String(page || "1").trim();
    if (!/^\d+$/.test(pageValue) || parseInt(pageValue, 10) < 1) {
        return Response.error("Trang không hợp lệ");
    }

    var p = parseInt(pageValue, 10);
    var r = fetchApi("/novel/keyword/" + encodeURIComponent(tagId) + "?page=" + p + "&limit=20", true);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tải danh sách thể loại thất bại");

    var d = json.data;
    if (!d) return Response.error("Không có dữ liệu");

    var items = d.data || d.items;
    if (!items || !items.length) return Response.error("Không có dữ liệu thể loại");

    var next = d.next_page ? String(p + 1) : "";
    return Response.success(buildItems(items), next);
}
