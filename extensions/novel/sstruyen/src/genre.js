// genre.js — Danh sach the loai SS Truyen (sstruyen.net).
//
// Doc trang `/the-loai` (41 the loai, kiem chung live 2026-11-10).
// Moi muc co input la duong dan the loai; app se goi book.js voi input do.
// De trung theo URL (co 2 slug trung ten "Sắc": `/the-loai/truyen-sac`
// va `/the-loai/sac`).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    var r = fetchSsDoc(BASE_URL + "/the-loai");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var genres = [];
    var seen = {};
    doc.select("a[href*='/the-loai/']").forEach(function (el) {
        var href = el.attr("href") || "";
        var title = cleanText(el.text());
        if (!href || !title) return;
        var url = absUrl(href);
        if (seen[url]) return;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
