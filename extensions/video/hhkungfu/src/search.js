load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
// search.js — vua la tim kiem, vua la script danh sach cho cac tab
// home.js / genre.js (giong book.js ben novel).
// `query` la tu khoa tim kiem, hoac la duong dan/URL day du tu tab
// (vi du "/moi-cap-nhat", "/category/tu-tien").
// Tim kiem WP: GET /?s=<tu khoa>. Phan trang WP: /page/N/.
// Trang danh sach moi trang 16 phim.
function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query);
    page = String(page === undefined || page === null || page === "" ? "1" : page);

    var url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Mo tab danh sach: query la duong dan hoac URL day du.
        var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
        url = pageUrl(base, page);
    } else {
        // Tim kiem theo tu khoa.
        url = pageUrl(BASE_URL + "/?s=" + encodeURIComponent(query), page);
    }

    var response = fetchWithFallback(url);
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    var doc = response.html();

    var parsed = parseListPage(doc, page);
    return Response.success(parsed.items, parsed.next);
}
