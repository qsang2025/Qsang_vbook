// toc.js — muc luc chuong cua 小說狂人 (czbooks.net).
// TOC nam ngay trong trang sach, SSR day du, KHONG endpoint rieng,
// KHONG phan trang (ke ca 1.411 chuong). Selector that (khao sat
// 2026-11-07):
//   ul#chapter-list.nav.chapter-list > li > a
//     [href="//czbooks.net/n/{book}/{chapterSlug}?chapterNumber={N}"]
// QUIRK: ?chapterNumber bi site lo di hoan toan (kiem chung:
// /n/s6pbed/s6lc7698?chapterNumber=5 van tra 第1章) — KHONG BAO GIO
// tu dung URL bang chapterNumber, luon di theo slug trong TOC. Vi vay
// toc.js cat bo query, chi giu path: /n/{book}/{chapterSlug}.
// li.volume la tieu de quyen (du lieu quyen co loi san tren site,
// vd 诡秘之主 lap/thieu quyen) — BO QUA li.volume (no khong co <a>,
// vong lap chi lay <a> nen tu dong bo qua).
// Vi du: s6pbed 1.411 chuong (第1章 -> /n/s6pbed/s6lc7698);
// u3h23 《詭秘之主》 1.449 chuong, link KHONG co query. Khong can page.js.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var chapters = [];
    var seen = {};
    doc.select("ul#chapter-list > li > a").forEach(function (el) {
        var href = el.attr("href") || "";
        var name = cleanText(el.text());
        if (!href || !name) return;
        // Chi giu path, bo query (?chapterNumber=... bi site lo di).
        var q = href.indexOf("?");
        if (q !== -1) href = href.substring(0, q);
        var link = resolveHref(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
