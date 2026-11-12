// book.js — Renderer danh sach truyen dung chung cho QuanBen.
//
// Dung cho cac tab home.js / genre.js: input la duong dan trang the loai
// (VD `/category/1.html`) hoac URL day du; page la token trang sau
// (URL day du tu qbNextPage, "" = het).
// Trang the loai 18 truyen/trang, phan trang bang link "下一页"
// (/category/<N>_<P>.html).
// execute(query, page): page la URL day du thi uu tien dung page.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";
    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        url = BASE_URL + query;
    } else if (query) {
        url = BASE_URL + "/" + query;
    } else {
        url = BASE_URL + "/";
    }

    var r = fetchQBDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    var next = qbNextPage(doc);
    return Response.success(items, next);
}
