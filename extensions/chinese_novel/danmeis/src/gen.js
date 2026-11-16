// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - Danh muc: /xuanhuan (trang 1) + phan trang /xuanhuan/<n>.html
//   (30 sach/trang; /xuanhuan/ co "/" cuoi tra 404 nen khong dung).
// - Xep hang: /top_allvisit/, /top_goodnum/, /top_allvote/ + phan trang
//   /top_allvisit/<n>.html (cung bo cuc ul.j_bookList).
// page la so trang ke do lan goi truoc tra ve (data2); "" thi dung url.
// App cat "/" cuoi cua URL doi so — normalizeDmUrl khoi phuc dang dung
// (danh muc bo "/", xep hang giu "/" vi /top_allvisit/ moi dung).
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url, page) {
    var base = String(url || "");
    if (!base) base = BASE_URL + "/xuanhuan";
    base = normalizeDmUrl(base);
    if (!base) return Response.error("Đường dẫn danh sách không hợp lệ.");

    var target = base;
    var pn = 1;
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    if (pRaw !== "") {
        var n = parseInt(pRaw, 10);
        if (!isNaN(n) && n > 1) pn = n;
    }
    if (pn > 1) {
        var stripped = base.replace(/\/+$/, "");
        target = stripped + "/" + pn + ".html";
    }

    var r = fetchDmDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này.");
    var next = nextPageToken(r.doc);
    return Response.success(items, next);
}
