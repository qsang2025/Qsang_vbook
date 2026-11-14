// search.js — Tim kiem: API /novel/search?q=<tu khoa>&page=&limit=20.
// Tu khoa tieng Viet (khong dau, co dau, ten Han-Viet) duoc dich sang
// tieng Trung qua file helper.js (alias ten truyen -> tu dien offline ->
// Google Translate du phong); tu khoa tieng Trung dung thang. API chap
// ca chu gian the lan chu phon the (kiem chung 2026-11-14: q=剑来 tra
// dung 劍來 len dau).
load("config.js");
load("rate-limit.js");
load("helper.js");
function execute(key, page) {
    key = key || "";
    if (!key) return Response.error("Nhập từ khóa để tìm kiếm");

    var pageValue = String(page || "1").trim();
    if (!/^\d+$/.test(pageValue) || parseInt(pageValue, 10) < 1) {
        return Response.error("Trang không hợp lệ");
    }

    var p = parseInt(pageValue, 10);
    var resolved = novelSearchResolveQuery(key);
    if (!resolved.query) return Response.error(resolved.error || "Không dịch được từ khóa");

    var r = fetchApi("/novel/search?q=" + encodeURIComponent(resolved.query) + "&page=" + p + "&limit=20", true);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tìm kiếm thất bại");

    var d = json.data;
    if (!d) return Response.error("Không có kết quả");

    var items = d.items || d.data;
    if (!items || !items.length) return Response.error("Không có kết quả");

    var total = d.total || 0;
    var limit = d.limit || 20;
    var next = total > p * limit ? String(p + 1) : "";
    return Response.success(buildItems(items), next);
}
