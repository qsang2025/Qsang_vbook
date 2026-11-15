// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - /tongren/, /changgui/, /hot/ + phan trang /<cat>/index_N.html.
// - / (trang chu, 20 sach moi nhat, khong co pager -> het).
// - /e/tags/?tagid=<id> + phan trang /tags-etagid<id>-<n>.html.
// Tat ca cung bo cuc .bk + pager div.page ("下一页") nen dung chung
// parseListItems + nextPageHref (file helper.js).
// page la URL trang ke do lan goi truoc tra ve (data2); "" thi dung url.
// App cat "/" cuoi cua URL doi so — normalizeQbUrl tu them lai "/".
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

function execute(url, page) {
    var target = String(page || "");
    if (!target) target = String(url || "");
    if (!target) target = BASE_URL + "/tongren/";
    target = normalizeQbUrl(target);
    if (!target) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchQbDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này.");
    var next = nextPageHref(r.doc);
    return Response.success(items, next);
}
