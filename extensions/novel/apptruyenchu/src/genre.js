// genre.js — danh sach the loai cua App Truyen Chu.
// Site khong co trang /the-loai rieng; hang chip the loai nam ngay tren
// trang /truyen (31 the loai, khao sat 2026-11-06). Doc cac chip co href
// dang /truyen?cate=<slug> tu trang nay. Moi muc tro ve book.js voi input
// la URL the loai day du.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute() {
    var doc = fetchDoc(BASE_URL + "/truyen");
    if (!doc) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/truyen");

    var genres = [];
    var seen = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        // Chi lay chip the loai: href dang /truyen?cate=<slug> (co the kem
        // them tham so khac nhu keyword=). Bo qua link /truyen?sort=...,
        // /truyen?status=... va cac link truyen /truyen/<slug>.
        if (href.indexOf("/truyen?") !== 0 && href.indexOf("/truyen/?") !== 0) return;
        if (href.indexOf("cate=") === -1) return;
        var title = cleanText(el.text());
        if (!title || title === "Tất cả") {
            // Chip "Tat ca" tro ve /truyen (khong co cate=) nen khong vao
            // duoc day; giu nhanh nay phong khi site doi giao dien.
            if (!title) return;
        }
        var url = absUrl(href);
        if (seen[url]) return;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
