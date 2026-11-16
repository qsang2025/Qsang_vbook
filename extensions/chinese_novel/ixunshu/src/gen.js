// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - /ranking_list/month (the .item, 102 muc)
// - /aggregation/<id> (the .item noi bat 6 muc + #newscontent li 180 muc)
// Khong co phan trang tren cac trang nay (khong co .page) nen next = "".
// page la URL trang ke do lan goi truoc tra ve (data2); "" thi dung url.
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
    var target = String(page || "");
    if (!target) target = String(url || "");
    if (!target) target = BASE_URL + "/ranking_list/month";
    target = normalizeIxUrl(target);
    if (!target) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchIxDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) {
        return Response.error("Không có truyện trong danh sách này.");
    }
    return Response.success(items, "");
}
