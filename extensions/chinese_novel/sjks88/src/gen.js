// gen.js — Trang danh sach (execute(url, page) -> items, next).
//
// Trang danh sach cua site (kiem chung live 2026-11-16): the
// ul.list li (20 truyen/trang), phan trang /<duong>/index_<N>.html
// (trang 1 la /<duong>/index.html), link 下一页 trong ul.page.
// page la URL trang ke (tuyet doi) do lan goi truoc tra ve; "" = trang dau.
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
    var listUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listUrl = absUrl(String(page));
    } else {
        var u = String(url || "");
        if (u === "") u = "/";
        // App cat dau "/" cuoi cua URL arg luc chay that — bo luon
        // cho chac roi ghep /index.html (trang 1).
        u = u.replace(/\/+$/, "");
        listUrl = absUrl(u + "/index.html");
    }
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchSjDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện: " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
