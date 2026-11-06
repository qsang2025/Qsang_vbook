// genre.js — danh sach the loai cua Truyen Full.
// Site khong co trang /the-loai rieng (tra 404) nhung menu chinh tren
// trang chu co day du 46 link the loai dang /the-loai/<slug>/ (khao sat
// 2026-11-06). genre.js doc cac link do tu trang chu, moi muc tro ve
// book.js (renderer danh sach dung chung).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute() {
    var doc = fetchDoc(BASE_URL + "/");
    if (!doc) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/");

    var genres = [];
    var seen = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        if (!/\/the-loai\/[a-z0-9-]+\/$/.test(href)) return;
        var title = cleanText(el.text());
        if (!title) return;
        var url = absUrl(href);
        if (seen[url]) return;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
