// page.js — Phan trang muc luc (execute(url) -> [URL trang muc luc]).
//
// Site chia muc luc thanh nhieu trang 100 chuong (kiem chung live
// 2026-11-16): /indexlist/<id>/ (1-100), /indexlist/<id>/2/ (101-200)...
// Trang /indexlist/<id>/ co <select id="indexselect"> liet ke tat ca cac
// trang. App goi toc.js tren tung URL tra ve, theo thu tu.
// Nhan URL sach (detail) — tu suy ra id sach roi tai trang indexlist dau
// tien de doc select. Neu khong co select (1 trang) thi tra ve chinh
// trang indexlist do.
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

function execute(url) {
    var bookUrl = String(url || "");
    if (bookUrl.charAt(0) === "/") bookUrl = siteOrigin() + bookUrl;
    bookUrl = normalizeUrl(bookUrl);
    var m = bookUrl.match(/\/(\d+)\/?$/);
    if (!m) return Response.error("Không nhận ra id truyện trong URL: " + bookUrl);
    var firstPage = siteOrigin() + "/indexlist/" + m[1] + "/";
    var r = fetchSkDoc(firstPage);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pages = [];
    var seen = {};
    var opts = doc.select("#indexselect option");
    var i = 0;
    for (i = 0; i < opts.size(); i++) {
        var v = opts.get(i).attr("value");
        if (!v) continue;
        var link = absUrl(v);
        if (!seen[link]) {
            seen[link] = true;
            pages.push(link);
        }
    }
    if (pages.length === 0) pages.push(firstPage);
    return Response.success(pages);
}
