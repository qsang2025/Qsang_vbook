// search.js — Tim kiem truyen tren Truyen4u.
//
// KHAC AzTruyen (tim kiem cua AzTruyen hong hoan toan nen khong co
// search.js): tim kiem cua truyen4u HOAT DONG qua GET
// /tim-kiem/<tu-khoa> (kiem chung live 2026-11-12). JS cua site tu
// redirect sang /tim-kiem/ + encodeURIComponent(tu-khoa) khi submit
// form; POST / voi search_q tra ve trang chu khong loc (vo dung).
// Ket qua khop mo theo tu khoa (VD "hoang hon" tra chu yeu truyen co
// "Hoàng"/"Hoang" trong ten), 20 truyen/trang, phan trang ?page=N
// (nut "›" trong div.pagination-control ul.page — dung chung
// azNextPage voi book.js). execute(query, page): page la token trang
// sau (URL day du tu azNextPage, hoac so trang "2", "" = trang dau).
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
    page = page || "";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm.");

    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (page && !isNaN(parseInt(page, 10))) {
        url = BASE_URL + "/tim-kiem/" + encodeURIComponent(query) + "?page=" + parseInt(page, 10);
    } else {
        url = BASE_URL + "/tim-kiem/" + encodeURIComponent(query);
    }

    var r = fetchT4Doc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc, -1);
    if (items.length === 0) return Response.success([], "");
    var next = azNextPage(doc);
    return Response.success(items, next);
}
