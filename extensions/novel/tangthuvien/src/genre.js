// genre.js — Doc the loai live tu /truyen (50 the loai, kiem chung
// 2026-11-13). The loai nam trong bo loc an cua trang /truyen dang
// a[href="?genre=<slug>"]. Neu fetch that bai thi dung fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Tiên Hiệp", "tien-hiep"], ["Huyền Huyễn", "huyen-huyen"],
    ["Hệ Thống", "he-thong"], ["Xuyên Không", "xuyen-khong"],
    ["Hồng Hoang", "hong-hoang"], ["Đô Thị", "do-thi"],
    ["Kiếm Hiệp", "kiem-hiep"], ["Ngôn Tình", "ngon-tinh"],
    ["Đam Mỹ", "dam-my"], ["Đồng Nhân", "dong-nhan"],
    ["Trọng Sinh", "trong-sinh"], ["Cổ Đại", "co-dai"]
];

function execute() {
    var r = fetchTtvPage(BASE_URL + "/truyen");
    if (!r.error) {
        var data = [];
        var seen = {};
        var links = r.doc.select("a[href^=\"?genre=\"]");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "").trim().split("#")[0];
            var m = href.match(/^\?genre=([a-z0-9\-]+)$/);
            if (!m) continue;
            var full = BASE_URL + "/truyen?genre=" + m[1];
            if (seen[full]) continue;
            seen[full] = true;
            var title = cleanText(a.text());
            if (!title) continue;
            data.push({ title: title, input: full, script: "gen.js" });
        }
        if (data.length >= 20) return Response.success(data);
        if (data.length > 0) return Response.success(data);
    }

    var out = [];
    for (var j = 0; j < FALLBACK_GENRES.length; j++) {
        out.push({
            title: FALLBACK_GENRES[j][0],
            input: BASE_URL + "/truyen?genre=" + FALLBACK_GENRES[j][1],
            script: "gen.js"
        });
    }
    return Response.success(out);
}
