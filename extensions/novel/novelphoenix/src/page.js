// page.js — Phan trang muc luc.
//
// Input: URL chi tiet truyen. Doc #list-chapter tren trang chi tiet de
// lay data-total-page + data-base-url, tra ve danh sach URL tuyet doi cac
// trang muc luc CON LAI (trang 2..N — trang 1 toc.js da tra khi goi tren
// URL chi tiet). Truyen <= 40 chuong chi co 1 trang -> tra ve mang rong.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var listBox = selFirst(doc, "#list-chapter");
    if (!listBox) return Response.error("Không đọc được mục lục: " + url);
    var total = parseInt(listBox.attr("data-total-page") || "1", 10);
    if (isNaN(total) || total < 1) total = 1;
    var base = listBox.attr("data-base-url") || "";
    if (!base) {
        var m = url.match(/^https?:\/\/[^\/]+(\/[^?#]+)/);
        base = m ? m[1] : url;
    }
    var pages = [];
    for (var p = 2; p <= total; p++) {
        pages.push(absUrl(base + "?page=" + p));
    }
    return Response.success(pages);
}
