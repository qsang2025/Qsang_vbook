// gen.js — Danh sach theo duong dan (execute(input, page) -> items, next).
//
// Cac dang input (kiem chung live 2026-11-15):
// - "/book/", "/hot/", "/tongren/", "/xh/" va cac the loai khac:
//   20 truyen/trang, phan trang /<duong>/index_<N>.html
//   (vd /tongren/index_2.html), link 下一页 trong div.page.
// - page (next token) la URL day du cua trang ke tiep.
// Moi the div.bk co anh bia, ten (cat hau to "(1-279)"), tac gia,
// mo ta <p>.
// App cat dau "/" cuoi khoi arg khi chay that nen ham tu them lai cho
// duong dan dang thu muc (tru URL co query va file .html).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
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
    // file .html nhu /tongren/index_2.html).
    if (listUrl.indexOf("?") === -1 && listUrl.slice(-1) !== "/" && !/\.html$/i.test(listUrl)) {
        listUrl = listUrl + "/";
    }
    var r = fetchJxDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không có mục nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
