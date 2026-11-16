// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - Danh muc: /<cat>/ (trang 1), /<cat>/list_2.html, /<cat>/list_3.html, ...
// - Tag: /tags-<id>-0.html (trang 1), /tags-<id>-1.html, ...
// Ca hai cung bo cuc .list_article ul li + pager div.dede_pages (link
// "下一页") nen dung chung parseFxList + nextFxPage (file helper.js).
// page la URL trang ke do lan goi truoc tra ve (data2); "" thi dung url.
// App cat "/" cuoi cua URL doi so — normalizeFxUrl tu them lai "/"
// (vd. /chuanyue khong "/" se 301 ve dang co "/").
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
    if (!target) target = BASE_URL + "/chuanyue/";
    target = normalizeFxUrl(target);
    if (!target) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchFxDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseFxList(r.doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này.");
    var next = nextFxPage(r.doc);
    return Response.success(items, next);
}
