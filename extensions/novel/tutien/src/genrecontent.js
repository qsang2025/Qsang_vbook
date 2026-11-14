// genrecontent.js — Danh sach truyen theo the loai cua TruyenCv.
//
// API: GET /story/list/{slug}/?page_size=20&page=N tra JSON phan trang
// {count, next, results}. Phan trang theo data.next.
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var slug = (url || "").trim();
    if (!slug) return Response.error("Thiếu mã thể loại");

    var apiUrl = BASE_URL + "/story/list/" + encodeURIComponent(slug) + "/?page_size=20&page=" + p;
    var r = fetchTT(apiUrl, { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data || !data.results) return Response.error("Không tải được danh sách truyện");

    var items = [];
    var i = 0;
    for (i = 0; i < data.results.length; i++) {
        var item = storyToItem(data.results[i]);
        if (item) items.push(item);
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextFromApi(data, p));
}
