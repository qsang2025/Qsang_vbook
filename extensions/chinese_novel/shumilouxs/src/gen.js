// gen.js — Trang danh sach (execute(url, page) -> items, next).
//
// Xu ly ca 2 dang trang danh sach cua site (kiem chung live 2026-11-16):
// - Dang #newscontent .l li: trang chu "/" (60 truyen), trang the loai
//   /list/<slug>/<N>.html (32 truyen/trang). Phan trang qua link ">>"
//   trong #pagelink.
// - Dang div.item: 排行榜 /rank/allvisit/ (30 truyen, 1 trang, khong
//   phan trang).
// page la URL trang ke (tuyet doi) do lan goi truoc tra ve; "" = trang dau.
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
    var listUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listUrl = absUrl(String(page));
    } else {
        var u = String(url || "");
        if (u === "") u = "/";
        listUrl = absUrl(u);
    }
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchSkDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện: " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
