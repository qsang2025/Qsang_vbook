// search.js — tim kiem tu khoa (/vod/search/) va renderer danh sach cho tab
// home/genre (/show/... hoac /type/...).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query);
    page = String(page === undefined || page === null || page === "" ? "1" : page);
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var isListPath = (query.indexOf("/") === 0 || query.indexOf("http") === 0);
    var url = "";
    if (isListPath) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : (BASE_URL + query);
        url = buildPagedUrl(base, page);
    } else {
        url = BASE_URL + "/vod/search/?wd=" + encodeURIComponent(query);
    }

    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được danh sách phim: " + url);

    var items = parseCards(doc, !isListPath);
    if (items.length === 0) return Response.success([], "");
    var next = isListPath ? nextPageTokenHhhtq(doc, page) : "";
    return Response.success(items, next);
}
