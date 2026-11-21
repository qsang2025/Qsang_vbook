// search.js — danh sach theo tab/the loai va tim kiem tren HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(key, page) {
    var input = String(key === undefined || key === null ? "" : key).trim();
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;

    var targetUrl = "";
    if (!input) {
        targetUrl = BASE_URL + "/popular-tag/hoat-hinh-3d/";
    } else if (input.indexOf("http") === 0 || input.indexOf("/") === 0) {
        targetUrl = input.indexOf("http") === 0 ? normalizeUrl(input) : (BASE_URL + input);
    } else {
        targetUrl = BASE_URL + "/?s=" + encodeURIComponent(input);
    }

    targetUrl = buildPagedUrl(targetUrl, p);
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDocWithFallback(targetUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được danh sách phim: " + targetUrl);

    var parsed = parseListPage(doc, p);
    return Response.success(parsed.items, parsed.next);
}
