// genre.js — Doc the loai live tu /the-loai (~200 the loai, kiem chung
// 2026-11-13). Bo trung theo href; chi lay link dang /the-loai/<slug>.html
// (1 doan, co .html) — loai cac link sap xep /the-loai/<slug>/truyen-hot.html
// va muc gia "tat-ca". Neu fetch that bai thi dung fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Ngôn Tình", "ngon-tinh"], ["Tiên Hiệp", "tien-hiep"],
    ["Huyền Huyễn", "huyen-huyen"], ["Đô Thị", "do-thi"],
    ["Đam Mỹ", "dam-my"], ["Đồng Nhân", "dong-nhan"],
    ["Trọng Sinh", "trong-sinh"], ["Hệ Thống", "he-thong"],
    ["Xuyên Không", "xuyen-khong"], ["Cổ Đại", "co-dai"],
    ["Mạt Thế", "mat-the"], ["Quân Sự", "quan-su"],
    ["Sắc Hiệp", "sac-hiep"], ["Convert", "convert"],
    ["Ngược", "nguoc"], ["Kiếm Hiệp", "kiem-hiep"],
    ["Dị Giới", "di-gioi"], ["Khoa Huyễn", "khoa-huyen"],
    ["Lịch Sử", "lich-su"], ["Võng Du", "vong-du"]
];

function execute() {
    var r = fetchTvPage(BASE_URL + "/the-loai");
    if (!r.error) {
        var data = [];
        var seen = {};
        var links = r.doc.select("a[href*=\"/the-loai/\"]");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "").trim().split("#")[0];
            // Chi nhan dang /the-loai/<slug>.html (1 doan duong dan)
            var m = href.match(/\/the-loai\/([a-z0-9\-\+]+)\.html$/);
            if (!m) continue;
            if (m[1] === "tat-ca") continue;
            var full = normalizeUrl(href);
            if (!full || seen[full]) continue;
            seen[full] = true;
            var title = cleanText(a.text());
            if (!title) continue;
            data.push({ title: title, input: full, script: "gen.js" });
        }
        if (data.length >= 50) return Response.success(data);
        // It qua thi van tra nhung gi doc duoc (khong dung fallback de
        // tranh trung lap); neu doc duoc qua it thi roi xuong fallback.
        if (data.length > 0) return Response.success(data);
    }

    var out = [];
    for (var j = 0; j < FALLBACK_GENRES.length; j++) {
        out.push({
            title: FALLBACK_GENRES[j][0],
            input: BASE_URL + "/the-loai/" + FALLBACK_GENRES[j][1] + ".html",
            script: "gen.js"
        });
    }
    return Response.success(out);
}
