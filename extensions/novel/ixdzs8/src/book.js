// book.js — renderer danh sach dung chung cua 爱下电子书 (ixdzs8.com).
// home.js / genre.js / detail.js (genres, tags) tro ve day. Nhan query
// la duong dan danh sach (hoac URL day du):
//   /new/ (最近更新, ?page=N), /hot/ (?page=N), /end/ (?page=N),
//   /sort/<id>/ (index-0-0-0-<P>.html), /tags/<tag> (?page=N).
// Tat ca deu dung mot markup: ul.u-list > li.burl, 20 truyen/trang
// (xem helper.js parseBookRows).
// Phan trang: token trang ke tra ve la PATH cua link ke trong pager
// (vd "/new/?page=2", "/sort/1/index-0-0-0-2.html"); luot goi sau nhan
// page bat dau bang "/" thi fetch thang path do, nen khong can doan
// pattern phan trang khi theo link that.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    var path = query;
    if (path.indexOf("http") === 0) {
        var m0 = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = m0 ? m0[1] : path;
    }
    if (path.charAt(0) !== "/") path = "/" + path;

    var pageUrl = "";
    if (page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        pageUrl = BASE_URL + page;
    } else {
        pageUrl = BASE_URL + path;
    }

    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = parseBookRows(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + pageUrl);

    return Response.success(items, nextPagePath(doc));
}
