// genre.js — Danh sach the loai Wetruyen (wetruyen.com).
//
// Doc cac link the loai tu trang chu (42 the loai, kiem chung live
// 2026-11-11). Link the loai dang `/truyen-<slug>/full/` — day la dang
// canonical (khong-`/full/` 301 ve `/full/`). Ten hien thi chuan hoa:
// bo tien to "Truyện " va hau to " Full" ("Tiên Hiệp Full" /
// "Truyện Tiên Hiệp" -> "Tiên Hiệp"). Moi muc tro ve book.js
// (renderer danh sach dung chung).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    var r = fetchWtDoc(BASE_URL + "/");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var genres = [];
    var seen = {};
    doc.select("a[href*='/truyen-']").forEach(function (el) {
        var href = el.attr("href") || "";
        if (!/\/truyen-[a-z0-9-]+\/full\/$/.test(href)) return;
        var title = cleanText(el.text());
        if (!title) return;
        title = title.replace(/^Truyện\s+/i, "").replace(/\s+Full$/i, "");
        if (!title) return;
        var url = absUrl(href);
        if (seen[url]) return;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
