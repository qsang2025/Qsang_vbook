// gen.js — Trang danh sach 52书库 (52shuku.net).
//
// Dung chung cho tab trang chu (home.js) va the loai (genre.js): input la
// duong dan danh sach ("/yanqing/", "/bl/", ...) hoac URL day du.
// Trang the loai co ~25-27 truyen/trang, phan trang /index_<N>.html
// (kiem chung live 2026-11-13: /yanqing/index_2.html ton tai, la trang 2
// that). Trang cuoi khong co link "下一页" co href nen tra data2 = "".
// 2 muc goi y tren trang the loai (goi y dau trang + goi y tac gia) bi
// loai boi parseExcerpt (link khong chua "_b/" va khong co .auth-span).
// execute(input, page).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(input, page) {
    input = input || "";
    if (!input) input = "/yanqing/";
    var url = input;
    if (url.indexOf("http") !== 0) {
        url = BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    }
    url = normalizeUrl(url);

    var p = 1;
    if (page) {
        var pn = parseInt(page, 10);
        if (!isNaN(pn) && pn > 1) p = pn;
    }
    if (p > 1) {
        url = url.replace(/\/+$/, "") + "/index_" + p + ".html";
    }

    var r = fetch52Doc(url);
    if (r.error) return Response.error(r.error);

    var items = parseBookList(r.doc);
    if (items.length === 0) return Response.success([], "");

    var next = "";
    var nextEl = safeFirst(r.doc.select("a:contains(下一页)"));
    if (nextEl !== null) {
        var href = nextEl.attr("href");
        if (href && href.indexOf("index_") !== -1) next = String(p + 1);
    }
    return Response.success(items, next);
}
