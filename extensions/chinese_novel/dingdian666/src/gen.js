// gen.js — Danh sach truyen 1 the loai (execute(input, page)
// -> items, next).
//
// input la duong dan danh sach (vd "/sort/1_1/"); page la token
// trang ke (href cua nut 下页, vd "/sort/1_2/"). Moi trang 20 muc
// .lastupdate ul li (kiem chung live 2026-11-15).
// Trang kieu thu muc can dau "/" cuoi — app cat dau "/" cuoi khoi
// arg khi chay that nen ham tu them lai.
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
    // Duong dan kieu thu muc (/sort/1_1/) can dau "/" cuoi.
    if (listUrl.slice(-1) !== "/") {
        listUrl = listUrl + "/";
    }
    var r = fetchDdDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookRows(doc);
    if (items.length === 0) {
        return Response.error("Không có truyện nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    // Nut 下页: div.page a.zhuan chu "下页" (vd "/sort/1_2/").
    // Trang cuoi khong co link 下页 -> het. Phong thu: neu so trang
    // trong href <= so trang hien tai thi cung coi nhu het.
    var next = "";
    var curMatch = listUrl.match(/_(\d+)\/$/);
    var curPage = curMatch ? parseInt(curMatch[1], 10) : 1;
    var links = doc.select(".page a.zhuan");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下页") {
            var href = a.attr("href") || "";
            var m = href.match(/_(\d+)\/$/);
            if (m && parseInt(m[1], 10) > curPage) next = href;
            break;
        }
    }
    return Response.success(items, next);
}
