// gen.js — Danh sach theo duong dan (execute(input, page) -> items, next).
//
// Cac dang input (kiem chung live 2026-11-15):
// - "/dayvisit/", "/allvisit/", "/monthvisit/": bang xep hang.
// - "/full.html": truyen hoan thanh.
// - "/genre/<Ten>/": 20 truyen/trang, phan trang ?page=N.
// - "/tag/<slug>/": cung dang danh sach 20/trang.
// Moi trang 20 truyen (.list-novel .row); phan trang bang
// ul.pagination li.next (xem file helper.js).
// App cat dau "/" cuoi khoi arg khi chay that nen ham tu them lai cho
// duong dan dang thu muc (tru /full.html va URL co query).
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
    // Duong dan dang thu muc can dau "/" cuoi (tru URL co query va
    // file .html nhu /full.html).
    if (listUrl.indexOf("?") === -1 && listUrl.slice(-1) !== "/" && !/\.html$/i.test(listUrl)) {
        listUrl = listUrl + "/";
    }
    var r = fetchNnDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseNovelList(doc);
    if (items.length === 0) {
        return Response.error("Không có mục nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = nextPageHref(doc, listUrl);
    return Response.success(items, next);
}
