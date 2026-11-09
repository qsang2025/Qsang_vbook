// toc.js — muc luc chuong cua 笔趣阁 (biquge.tw).
// Toan bo chuong nam tren trang rieng /book/<id>/ (trang chi tiet chi
// hien ~15 chuong moi nhat) — KHONG phan trang nen khong can page.js.
// Vi du: detail https://www.biquge.tw/book/199376.html -> TOC
// https://www.biquge.tw/book/199376/ (khao sat 2026-11-06: 凡人修仙传
// 2620 chuong tren 1 trang; 异界龙神 1869 chuong).
// Selector chinh: .list-chapter .booklist ul li a. Du phong: gom tat ca
// link dang /book/<id>/<so>.html roi dedupe theo URL.
// Ten chuong = text cua link (vd "第一章 山边小村").
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// challenge-handler.js, helper.js vao src/.
// N3 (v4): fetch qua fetchPageDoc() (fetchDocWithFallback + kiem
// challenge, tra loi tieng Viet co huong dan khi gap Cloudflare/login).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var tocUrl = url.replace(/\.html$/, "/");
    if (tocUrl === url) tocUrl = url.replace(/\/$/, "") + "/";
    var r = fetchPageDoc(tocUrl, "Không tải được mục lục");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // N2 (v4): trang loi cua site tra HTTP 200, tieu de "出错了" —
    // truyen khong ton tai (vd /book/99999999/), khong phai doi giao dien.
    if (isErrorPage(doc)) return Response.error("Truyện không tồn tại (link có thể đã đổi): " + tocUrl);

    var chapters = [];
    var seen = {};

    function addChapter(el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf(".html") === -1) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    // Khoi day du (thu tu tang dan tu chuong 1).
    doc.select(".list-chapter .booklist ul li a").forEach(addChapter);

    // Du phong: gom tat ca link chuong tren trang.
    if (chapters.length === 0) {
        doc.select('a[href*="/book/"]').forEach(function (el) {
            var href = el.attr("href") || "";
            if (/\/book\/\d+\/\d+\.html/.test(href)) addChapter(el);
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
