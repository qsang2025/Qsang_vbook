// page.js — PHAN TRANG MUC LUC (execute(url) -> [url trang muc luc]).
//
// Muc luc cua sto66.com chia 500 chuong/trang:
//   Trang 1: /chapter/<bookId>.html
//   Trang N: /chapter/<bookId>/<N>.html
// Hop chon trang select#linkIndex tren trang muc luc liet ke du cac trang
// (option value la duong dan trang). page.js nhan URL trang truyen
// (/book/<id>.html) hoac URL muc luc, suy ra bookId, tai trang 1 va tra
// ve danh sach URL trang muc luc theo thu tu; app goi toc.js tren tung URL.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function bookIdOf(url) {
    var m = String(url || "").match(/\/(?:book|chapter)\/([A-Za-z0-9]+)(?:\.html|\/)/);
    return m ? m[1] : "";
}

function execute(url) {
    url = normalizeUrl(url);
    var bookId = bookIdOf(url);
    if (!bookId) return Response.error("Không suy ra được mã truyện từ URL: " + url);

    var firstPage = siteOrigin() + "/chapter/" + bookId + ".html";
    rateLimitDelay("sto66.com", 500, 1500);
    var doc = fetchDoc(firstPage);
    if (!doc) return Response.error("Không tải được mục lục: " + firstPage);

    var pages = [];
    var seen = {};
    var options = doc.select("#linkIndex option");
    var i = 0;
    for (i = 0; i < options.size(); i++) {
        var v = String(options.get(i).attr("value") || "");
        if (!v) continue;
        var link = absUrl(v);
        if (seen[link]) continue;
        seen[link] = true;
        pages.push(link);
    }

    if (pages.length === 0) pages.push(firstPage);
    return Response.success(pages);
}
