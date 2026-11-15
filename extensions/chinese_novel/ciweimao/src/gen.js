// gen.js — Trang the loai (execute(input, page) -> items, next).
//
// Lay danh sach qua API JSONP cua site (khong scrape HTML — trang
// /book_list/<id> la shell MIP khong co link truyen trong HTML tinh):
// GET /index/book_list_data?keyword=&category_type=<id>&pn=<page>.
// 10 muc/trang; API khong tra total — het muc thi items rong, next = "".
// input: id so cua the loai ("0" = tat ca). page: so trang ("1" mac dinh).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url, page) {
    var categoryId = String(url === undefined || url === null ? "" : url);
    if (categoryId === "") categoryId = "0";
    var pn = String(page === undefined || page === null || page === "" ? "1" : page);
    var n = parseInt(pn, 10);
    if (isNaN(n) || n < 1) n = 1;

    var r = fetchCwList(categoryId, n);
    if (r.error) return Response.error(r.error);
    if (r.items.length === 0) {
        return Response.error("Không có truyện trong thể loại này.");
    }
    var items = [];
    var i = 0;
    for (i = 0; i < r.items.length; i++) {
        var one = parseApiBook(r.items[i]);
        if (one !== null) items.push(one);
    }
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện.");
    }
    // API tra dung 10 muc/trang khi con trang sau; it hon thi het.
    var next = (r.items.length >= 10) ? String(n + 1) : "";
    return Response.success(items, next);
}
