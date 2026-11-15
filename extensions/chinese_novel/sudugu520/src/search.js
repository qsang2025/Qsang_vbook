// search.js — Tim kiem (execute(query, page) -> items, next).
//
// Endpoint that (kiem chung live 2026-11-15): GET /i/sor.aspx?key=<tu
// khoa> — form tim kiem nam tren /i/so.aspx (rescan #10 bo sot vi form
// khong nam tren trang chu). 10 ket qua/trang, dang the div.item giong
// trang danh sach; phan trang ?key=<tu khoa>&p=<N> (vd "共2本小说" cho
// tu khoa "两界", 4 trang cho tu khoa "修仙").
// Tim kiem theo tieu de + tac gia (site tu xu ly).
//
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
    var q = String(query || "").replace(/^\s+|\s+$/g, "");
    if (!q) return Response.error("Nhập từ khóa để tìm truyện.");
    var searchUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        searchUrl = absUrl(String(page));
    } else {
        searchUrl = siteOrigin() + "/i/sor.aspx?key=" + encodeURIComponent(q);
    }
    if (!searchUrl) return Response.error("Đường dẫn tìm kiếm không hợp lệ.");
    var r = fetchSgDoc(searchUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.success([], "");
    }

    var next = nextPageHref(doc, searchUrl);
    return Response.success(items, next);
}
