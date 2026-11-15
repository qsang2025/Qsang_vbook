// gen.js — Danh sach theo duong dan (execute(input, page) -> items, next).
//
// 3 dang input (kiem chung live 2026-11-15):
// - "/novels/": danh sach 8 truyen (ten + trang thai + anh bia).
// - "/category/<slug>/": 10 bai chuong moi nhat/trang cua 1 truyen.
// - Trang truyen "/<slug>/": muc luc 10 chuong/trang (table.chapter-table).
// - "/": trang chu — cac bai viet moi nhat (thong bao + gioi thieu truyen).
// Phan trang WordPress: /page/2/, /page/3/ ... (nut trong .pagination).
// App cat dau "/" cuoi khoi arg khi chay that nen ham tu them lai cho
// duong dan dang thu muc.
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
    // Duong dan dang thu muc can dau "/" cuoi (tru khi co query ?s=).
    if (listUrl.indexOf("?") === -1 && listUrl.slice(-1) !== "/") {
        listUrl = listUrl + "/";
    }
    var r = fetchMrDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var pathOnly = listUrl.replace(/^https?:\/\/[^\/]+/, "");
    if (pathOnly.indexOf("/novels") === 0) {
        items = parseNovelList(doc);
    } else if (isNovelPageUrl(listUrl)) {
        items = parseTocRows(doc);
    } else {
        items = parseArticleList(doc);
    }
    if (items.length === 0) {
        return Response.error("Không có mục nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = nextPageHref(doc, listUrl);
    return Response.success(items, next);
}
