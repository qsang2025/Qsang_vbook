// gen.js — danh sach sach theo the loai / trang list (execute(url, page) -> items, next).
//
// - Trang the loai /booklists/<id>/ va trang list /booklists/newrelease/,
//   /booklists/update/, /booklists/rank/, /booklists/finish/,
//   /booklists/list/all_all_all/: 30 muc/trang, bo cuc
//   div.shadow-sm.bg-white (kiem chung live 2026-11-16).
// - Phan trang kieu /booklists/2/2.html (kiem chung: .pager co link
//   2.html...626.html); next token la URL tuyet doi trang ke, "" khi het.
// - page la URL trang ke (tuyet doi) do lan goi truoc tra ve; "" = trang dau.
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
    page = String(page || "");
    var listUrl = "";
    if (page !== "") {
        listUrl = normalize8bUrl(page);
    } else {
        var u = String(url || "");
        if (u === "") u = "/booklists/newrelease/";
        listUrl = absUrl(normalize8bUrl(u));
    }
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetch8bDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện: " + listUrl);
    }

    var next = nextPageHref(doc, listUrl);
    return Response.success(items, next);
}
