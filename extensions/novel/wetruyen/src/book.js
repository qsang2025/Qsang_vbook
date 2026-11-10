// book.js — Renderer danh sach truyen dung chung cho Wetruyen (wetruyen.com).
//
// Dung cho cac tab home.js / genre.js: input la duong dan chuyen muc
// (VD `/truyen-hot/`, `/truyen-tien-hiep/full/`) hoac URL day du.
// Trang danh sach dung `.row[itemtype=".../Book"]` (25/trang),
// phan trang dang `<base>trang-N/` (xem helper.js: parseBookList /
// wtPagedUrl / wtNextPage). execute(query, page): query la path hoac URL,
// page la so trang ("1" mac dinh).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var url = "";
    if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        url = BASE_URL + query;
    } else if (query) {
        url = BASE_URL + "/tim-kiem/?tukhoa=" + encodeURIComponent(query);
    } else {
        url = BASE_URL + "/truyen-hot/";
    }
    url = wtPagedUrl(url, page);

    var r = fetchWtDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    var next = wtNextPage(doc, page);
    return Response.success(items, next);
}
