// gen.js — Danh sach truyen 1 muc (execute(input, page)
// -> items, next).
//
// input la duong dan danh sach (vd "/list/1.html", "/lastupdate/",
// "/top/"); page la token trang ke (href cua nut ">" trong
// div.pages, vd "/list/1/2.html"). Moi trang 20 muc dang the dl
// (top/full 30 muc), kiem chung live 2026-11-15.
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

function execute(input, page) {
    var listPath = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listPath = String(page);
    } else {
        listPath = String(input || "");
    }
    if (!listPath) return Response.error("Thiếu đường dẫn danh sách.");
    var listUrl = absUrl(listPath);
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchMtDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseListRows(doc);
    if (items.length === 0) {
        return Response.error("Không có truyện nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = nextPageToken(doc, listUrl);
    return Response.success(items, next);
}
