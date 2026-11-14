// search.js — Tim kiem cua TruyenCv.
//
// API: GET /story/user/search/?q=<tu khoa>&page=<p>&page_size=10 tra
// JSON phan trang {count, next, results}. Tim duoc ca khi go khong dau
// (API tim rong theo tieu de/noi dung).
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    var kw = (key || "").trim();
    if (!kw) return Response.success([], "");
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var apiUrl = BASE_URL + "/story/user/search/?q=" + encodeURIComponent(kw) + "&page=" + p + "&page_size=10";
    var r = fetchTT(apiUrl, { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data || !data.results) return Response.error("Không tìm được truyện");

    var items = [];
    var i = 0;
    for (i = 0; i < data.results.length; i++) {
        var item = storyToItem(data.results[i]);
        if (item) items.push(item);
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextFromApi(data, p));
}
