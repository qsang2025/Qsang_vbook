// search.js — Tim kiem theo tu khoa (execute(query, page) -> items, next).
//
// Endpoint (kiem chung live 2026-11-16): GET /searche6.html?searchkey=
// <tu khoa> — form tim kiem nam tren trang chu (name="searchkey").
// Ket qua dang the div.item giong trang 排行榜 (anh bia data-original,
// tieu de + link chi tiet, mo ta, tac gia). 1 trang duy nhat, khong phan
// trang (82 ket qua cho tu khoa "梦魇").
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

function execute(query, page) {
    var q = String(query || "").replace(/^\s+|\s+$/g, "");
    if (!q) return Response.error("Nhập từ khóa để tìm truyện.");
    var searchUrl = siteOrigin() + "/searche6.html?searchkey=" + encodeURIComponent(q);
    var r = fetchSkDoc(searchUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + q + "\"");
    }
    return Response.success(items, "");
}
