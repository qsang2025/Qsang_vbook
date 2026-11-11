// book.js — renderer danh sach dung chung cua 书海阁 (shuhaige.tw).
// home.js / genre.js / detail.js (genres) tro ve day. Nhan query la
// duong dan danh sach (hoac URL day du) + page la so trang.
//
// Layout theo khao sat 2026-11-07:
// - Trang 1 the loai /<slug>/: 6 div.item noi bat (xem helper.js
//   parseFeaturedItem).
// - Trang N>=2 the loai /<slug>/<N>.html: bang div.novelslist2 > ul > li
//   (xem helper.js parseRowItem; dong dau la header -> bo qua).
// - Bang xep hang /allvisit/, /allvote/, /goodnum/, /lastupdate/: cung
//   layout div.novelslist2, 50 dong/trang, phan trang /allvisit/<N>.html.
// - /quanben/: trang tong hop 6 muc (div.novelslist > div.content >
//   div.top), KHONG phan trang (/quanben/2.html chi tra 14B) — chi lay
//   trang 1, token trang ke luon "".
// KHONG co link phan trang tren trang the loai -> tu doan URL
// /<slug>/<N>.html (bang xep hang /allvisit/<N>.html) va DUNG KHI LIST
// RONG (title "列表N" clamp o 5, khong dang tin; trang rong van 200).
// Token trang ke tra ve la SO TRANG (chuoi so); luot sau nhan page la so
// thi fetch trang do.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
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
    // Trang 1 the loai dang "/<slug>/" (khong .html); giu nguyen.
    // Bo "/index.html" neu co.
    path = path.replace(/\/index\.html$/, "/");

    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var pageUrl = "";
    if (n === 1) {
        pageUrl = BASE_URL + path;
    } else {
        // /quanben/ khong phan trang: trang 2 tro di la rong.
        if (path === "/quanben/" || path === "/quanben") {
            return Response.success([], "");
        }
        var base = path.replace(/\/+$/, "");
        pageUrl = BASE_URL + base + "/" + n + ".html";
    }

    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};

    function addItem(item) {
        if (!item || !item.link) return;
        if (seen[item.link]) return;
        seen[item.link] = true;
        items.push(item);
    }

    // Layout 1: 6 div.item noi bat (trang 1 the loai).
    doc.select("div.item").forEach(function (el) {
        addItem(parseFeaturedItem(el));
    });

    // Layout 2: bang div.novelslist2 (trang N>=2, bang xep hang).
    if (items.length === 0) {
        doc.select("div.novelslist2 ul li").forEach(function (el) {
            addItem(parseRowItem(el));
        });
    }

    // Layout 3: /quanben/ — div.novelslist > div.content > div.top
    // (6 truyen noi bat) + 6 <ul> danh sach (120 link ten/tac gia).
    if (items.length === 0) {
        doc.select("div.novelslist div.top").forEach(function (el) {
            addItem(parseTopItem(el));
        });
        doc.select("div.novelslist ul li").forEach(function (el) {
            var a = el.select('a[href$=".html"]').first();
            if (a === null) return;
            var href = a.attr("href");
            var name = cleanText(a.attr("title")) || cleanText(a.text());
            if (!href || !name) return;
            var link = absUrl(href);
            if (seen[link]) return;
            var author = cleanText(el.text()).replace(name, "").replace(/^\//, "");
            addItem({
                name: htmlDecode(name),
                cover: "",
                link: link,
                description: author,
                tag: "完结",
                host: siteOrigin()
            });
        });
    }

    // Dung khi list rong (het trang): tra items rong, token "".
    var next = "";
    if (items.length > 0 && path !== "/quanben/" && path !== "/quanben") {
        next = String(n + 1);
    }
    return Response.success(items, next);
}
