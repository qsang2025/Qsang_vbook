// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - The loai: /list/<cat>/<n>.html (30 sach/trang; /list/0/ = tat ca).
// - Sap xep: /lastupdate_0_0_0_<n>.html, /allvisit_0_0_0_<n>.html,
//   /monthvisit_0_0_2_<n>.html (cung bo cuc .article .block).
// page la so trang ke do lan goi truoc tra ve (data2); "" thi dung url.
// Bo cuc: .article > .block > ul > li > a[href=/book/<id>/] + span tac gia.
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
    if (!base) base = BASE_URL + "/list/0/1.html";
    base = normalizeIqUrl(base);
    if (!base) return Response.error("Đường dẫn danh sách không hợp lệ.");

    var target = base;
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    if (pRaw !== "") {
        var n = parseInt(pRaw, 10);
        if (!isNaN(n) && n > 1) target = buildListPageUrl(base, n);
    }

    var r = fetchIqDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này.");
    var next = nextListPageToken(r.doc, target);
    return Response.success(items, next);
}
