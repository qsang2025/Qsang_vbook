// gen.js — Danh sach truyen 1 bang / 1 the loai (execute(input, page)
// -> items, next).
//
// input la duong dan danh sach (vd "/lastupdate/", "/leibie1_1.html");
// page la token trang ke (href cua nut .next, vd "/lastupdate/2/",
// "/leibie1_2.html"). Moi trang 50 muc div#alistbox.
// Trang kieu thu muc (khong co .html) can dau "/" cuoi — app cat dau
// "/" cuoi khoi arg khi chay that nen ham tu them lai.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(input, page) {
    var listPath = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listPath = String(page);
    } else {
        listPath = String(input || "");
    }
    if (!listPath) return Response.error("Thiếu đường dẫn danh sách.");
    var listUrl = absUrl(listPath);
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    // Duong dan kieu thu muc (/lastupdate) can dau "/" cuoi.
    if (listUrl.indexOf(".html") === -1 && listUrl.slice(-1) !== "/") {
        listUrl = listUrl + "/";
    }
    var r = fetchTmDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookBoxes(doc);
    if (items.length === 0) {
        return Response.error("Không có truyện nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    var next = "";
    var nextEl = safeFirst(doc.select(".articlepage a.next"));
    if (nextEl !== null) next = nextEl.attr("href") || "";
    return Response.success(items, next);
}
