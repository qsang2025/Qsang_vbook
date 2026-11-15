// search.js — Tim kiem theo tu khoa (execute(query, page) -> items).
//
// Tim kiem qua GET /search/?key=<tu khoa> (kiem chung live 2026-11-16
// tu VM: 200, tra dung sach mau 落花時節又逢君 trong 24 ket qua; phan
// trang /search/?key=...&page=<n>). Ket qua dung cung bo cuc the
// div.shadow-sm.bg-white nhu trang the loai. Site dung UTF-8 nen tu khoa
// encodeURIComponent binh thuong. Khong can WebView — form tim kiem la
// GET don gian (khac cac site EmpireCMS dung POST).
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
    page = String(page || "");
    var url = "";
    if (page !== "") {
        url = normalize8bUrl(page);
    } else {
        query = String(query || "").trim();
        if (!query) return Response.error("Hãy nhập từ khóa tìm kiếm.");
        url = BASE_URL + "/search/?key=" + encodeURIComponent(query);
    }
    var r = fetch8bDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + query + "\"");
    }
    var next = nextPageHref(doc, url);
    return Response.success(items, next);
}
