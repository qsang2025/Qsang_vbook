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
// LUU Y /paihang/: __NUXT__ khong co mang nao trong cac key tren (da kiem
// chung 2026-11-10 ca tren trang WAF lan trang that) nen DOM la nguon chinh
// o day; moi sach co 2 anchor cung link (so thu hang + ten) nen parseBookRows
// GOP lai (ten that + bia that) thay vi giu anchor dau tien.
// WAF: www.qimao.com dung Aliyun WAF — fetch thuong co the nhan ve trang thu
// thach HTTP 200 thay cho trang that; book.js phat hien (isAliyunWafPage) va
// thu lai qua headless browser (fetchRealPageViaBrowser).
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

    // Trang thu thach Aliyun WAF (HTTP 200, khong phai trang that): thu lai qua
    // headless browser (chay JS cua WAF). Neu browser cung khong qua thi bao loi ro.
    if (raw && isAliyunWafPage(raw)) {
        var realDoc = fetchRealPageViaBrowser(pageUrl);
        if (realDoc) {
            doc = realDoc;
            try { raw = String(realDoc.html()); } catch (e3) { raw = ""; }
        } else {
            return Response.error("七猫 đang bật kiểm tra chống bot (tường lửa Aliyun) nên chưa tải được trang này. Hãy mở trang trong Trình duyệt của app rồi quay lại thử lại: " + pageUrl);
        }
    }

    var items = [];
    if (raw) items = extractNuxtBooks(raw);
    if (items.length === 0) items = parseBookRows(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện hoặc đang giới hạn truy cập): " + pageUrl);

    return Response.success(items, nextPagePath(doc, pageUrl));
}
