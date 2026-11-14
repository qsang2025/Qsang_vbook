// search.js — Tim kiem qua API /v1/search?q=<tu khoa>&page=N.
// Chay ca co dau va khong dau (kiem chung tu VM: "van dao" va "vạn đạo"
// deu ra Van Dao Truong Do). API tra total_page de phan trang.
load("config.js");
load("rate-limit.js");

function execute(query, page) {
    var q = String(query || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện");
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;

    var url = API_URL + "/v1/search?q=" + encodeKey(q) + "&page=" + p;
    var rr = blhFetchJson(url);
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.success) {
        return Response.error(json && json.error_message ? json.error_message : "Không tìm được truyện");
    }

    var items = [];
    var data = json.data || [];
    for (var i = 0; i < data.length; i++) {
        var e = data[i];
        var name = e.name ? String(e.name) : "";
        var slug = e.slug ? String(e.slug) : "";
        if (!name || !slug) continue;
        items.push({
            name: name,
            link: BASE_URL + "/truyen/" + slug,
            cover: e.img_url ? String(e.img_url) : "",
            description: (e.author_name ? String(e.author_name) : "") + " - " + (e.chapter_count ? e.chapter_count + " chương" : ""),
            tag: e.is_full ? "Full" : (e.category_name ? String(e.category_name) : ""),
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa này");
    var total = parseInt(json.total_page, 10) || 0;
    return Response.success(items, p < total ? String(p + 1) : "");
}
