// search.js — tim kiem tu khoa (/?s=<tu-khoa>) va renderer danh sach cho
// tab home/genre (/moi-cap-nhat, /category/...).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query);
    page = String(page === undefined || page === null || page === "" ? "1" : page);
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : (BASE_URL + query);
        url = pageUrl(base, page);
    } else {
        url = pageUrl(BASE_URL + "/?s=" + encodeURIComponent(query), page);
    }

    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được danh sách phim: " + url);

    var parsed = parseListPage(doc, page);
    return Response.success(parsed.items, parsed.next);
}
