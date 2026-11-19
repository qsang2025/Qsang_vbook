// gen.js — Danh sach theo duong dan (execute(input, page) -> items, next).
//
// Cac dang input (kiem chung live 2026-11-19):
// - bookbase_slave.php?orderstr=1/2, ?booktype=free,
//   ?endstr=2&orderstr=1: 50 truyen/trang, dong bang tr.
// - bookbase.php?fw=0&yc=0&xx=<id>&...: loc theo the loai, cung
//   dang bang tr.
// - page (next token) la URL day du cua trang ke tiep (link 下一页
//   trong .controlbar, href dang /bookbase_slave.php?...&page=N).
// Trang danh sach khong co anh bia tinh (bia tai qua JS
// picturePushList.php) nen cover de trong.
//
// Tai len: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// gbk.js, file cleanHtml.js, file helper.js.
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
    var listUrl = jjAbsUrl(listPath);
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchJjDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không có mục nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
