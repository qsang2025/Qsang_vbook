// gen.js — Danh sach truyen 1 the loai (execute(input, page)
// -> items, next).
//
// input la duong dan danh sach (vd "/fenlei/1/1/"); page la token
// trang ke (href cua nut 下一页, vd "/fenlei/1/2/"). Moi trang 10 muc
// #main .hot_sale (kiem chung live 2026-11-15).
// Duong dan kieu thu muc can dau "/" cuoi — app cat dau "/" cuoi khoi
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
    // Duong dan kieu thu muc (/fenlei/1/1/) can dau "/" cuoi.
    if (listUrl.slice(-1) !== "/") {
        listUrl = listUrl + "/";
    }
    var r = fetchDyDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseHotSaleRows(doc);
    if (items.length === 0) {
        return Response.error("Không có truyện nào ở trang này (site có thể đã đổi giao diện): " + listUrl);
    }

    // Nut 下一页: a.index-container-btn chu "下一页" (vd "/fenlei/1/2/"
    // hoac "/fenlei/2/" o danh sach tat ca). Trang cuoi khong co link
    // 下一页 -> het. Phong thu: neu href trung trang hien tai thi
    // cung coi nhu het. (Tuy UA desktop co them nut 上一页 cung class
    // nen phai duyet het cac nut roi chon dung chu "下一页", khong lay
    // nut dau tien.)
    var next = "";
    var navs = doc.select("a.index-container-btn");
    var i = 0;
    for (i = 0; i < navs.size(); i++) {
        var a = navs.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href") || "";
            if (href && href.indexOf("javascript:") !== 0 && absUrl(href) !== listUrl) next = href;
            break;
        }
    }
    return Response.success(items, next);
}
