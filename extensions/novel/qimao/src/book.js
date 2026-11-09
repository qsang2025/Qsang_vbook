// book.js — renderer danh sach dung chung cua 七猫免费小说 (qimao.com).
// home.js / genre.js tro ve day. Nhan query la duong dan danh sach
// (hoac URL day du):
//   /shuku/<loc>-<sort>-<N>/ (danh sach loc)
//   /paihang/<boy|girl>/<new|hot|...>/<date|month>/ (bang xep hang)
//
// NGUON CHINH — __NUXT__ state: trang danh sach la Nuxt SSR, HTML tho
// chua text nhung gan nhu KHONG co link that (trang chi tiet chi co 1
// anchor javascript:void(0)). Du lieu sach nam trong window.__NUXT__
// (mang sach o mot trong cac key book_list/books/list/... — helper.js
// extractNuxtBooks thu lan luot). DU PHONG: parse DOM bang anchor
// (helper.js parseBookRows) — dung khi trang nao do render link that.
// Phan trang: token trang ke tra ve la PATH cua link "下一页" that,
// hoac path /shuku/ da tang so trang cuoi; luot goi sau nhan page bat
// dau bang "/" thi fetch thang path do.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    var path = query;
    if (path.indexOf("http") === 0) {
        var m0 = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = m0 ? m0[1] : path;
    }
    if (path.charAt(0) !== "/") path = "/" + path;

    var pageUrl = "";
    if (page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        pageUrl = BASE_URL + page;
    } else {
        pageUrl = BASE_URL + path;
    }

    var res = fetchPage(pageUrl);
    if (!res) return Response.error("Không tải được trang danh sách: " + pageUrl);
    var doc = docFromResponse(res, pageUrl);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var raw = "";
    if (res.browser) {
        try { raw = String(res.doc.html()); } catch (e) { raw = ""; }
    } else {
        try { raw = String(res.text()); } catch (e2) { raw = ""; }
    }

    var items = [];
    if (raw) items = extractNuxtBooks(raw);
    if (items.length === 0) items = parseBookRows(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện hoặc đang giới hạn truy cập): " + pageUrl);

    return Response.success(items, nextPagePath(doc, pageUrl));
}
