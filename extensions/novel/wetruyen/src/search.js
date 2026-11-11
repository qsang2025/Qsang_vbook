// search.js — Tim kiem truyen Wetruyen (wetruyen.com).
//
// Tim kiem theo tu khoa qua `/tim-kiem/?tukhoa=<kw>` (25 ket qua/trang,
// phan trang `&paged=N`). Neu query la duong dan chuyen muc (bat dau bang
// "/" hoac "http") thi coi nhu duyet danh sach (phong khi tab nao do tro
// thang vao search.js). Ket qua dung `.row[itemtype=".../Book"]` (25/trang)
// nhu book.js. Khong co ket qua thi tra danh sach rong (khong phai loi).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
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
        return Response.error("Nhập từ khóa để tìm truyện.");
    }
    url = wtPagedUrl(url, page);

    var r = fetchWtDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc);
    if (items.length === 0) return Response.success([], "");
    var next = wtNextPage(doc, page);
    return Response.success(items, next);
}
