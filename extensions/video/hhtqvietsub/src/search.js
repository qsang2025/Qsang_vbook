// search.js — tim kiem tu khoa + renderer danh sach cho tab home/genre.
// Query bat dau bang "/" hoac "http" thi coi la duong dan danh sach cua
// site, khong phai tu khoa. Tu khoa dung /search/<tu-khoa> (site redirect
// ?s= ve duong dan nay). Phan trang: token trang ke tiep la URL tuyet doi
// lay tu link a.next.page-numbers; lan goi sau page la URL do thi tai
// thang, khong ghep /page/<n>.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function listUrl(query, page) {
    var p = String(page || "");
    if (p.indexOf("http") === 0) return normalizeUrl(p);
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        return normalizeUrl(query.indexOf("http") === 0 ? query : BASE_URL + query);
    }
    return BASE_URL + "/search/" + encodeURIComponent(query);
}

function execute(query, page) {
    query = query || "";
    page = page || "";
    if (!query && !page) return Response.error("Nhập từ khóa để tìm kiếm");

    var url = listUrl(query, page);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được danh sách phim: " + url);

    var items = movieItems(doc);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextListUrl(doc));
}
