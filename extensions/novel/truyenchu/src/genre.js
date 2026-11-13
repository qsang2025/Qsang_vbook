// genre.js — Doc the loai live tu .genres_wrap .genres cua trang chu
// (34 the loai, kiem chung 2026-11-13). Neu fetch that bai thi dung
// fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Cổ Đại", "co-dai"], ["Cung Đấu", "cung-dau"], ["Đam Mỹ", "dam-my"],
    ["Dị Giới", "di-gioi"], ["Dị Năng", "di-nang"], ["Điền Văn", "dien-van"],
    ["Đô Thị", "do-thi"], ["Đoản Văn", "doan-van"], ["Đông Phương", "dong-phuong"],
    ["Gia Đấu", "gia-dau"], ["Hài Hước", "hai-huoc"], ["Hệ Thống", "he-thong"],
    ["Huyền Huyễn", "huyen-huyen"], ["Khác", "khac"], ["Khoa Huyễn", "khoa-huyen"],
    ["Kiếm Hiệp", "kiem-hiep"], ["Lịch Sử", "lich-su"], ["Linh Dị", "linh-di"],
    ["Mạt Thế", "mat-the"], ["Ngôn Tình", "ngon-tinh"], ["Ngược", "nguoc"],
    ["Nữ Cường", "nu-cuong"], ["Quân Sự", "quan-su"], ["Sắc", "sac"],
    ["Sắc Hiệp", "sac-hiep"], ["Sủng", "sung"], ["Tiên Hiệp", "tien-hiep"],
    ["Trinh Thám", "trinh-tham"], ["Trọng Sinh", "trong-sinh"],
    ["Truyện Teen", "truyen-teen"], ["Võ Hiệp", "vo-hiep"], ["Võng Du", "vong-du"],
    ["Xuyên Không", "xuyen-khong"], ["Xuyên Nhanh", "xuyen-nhanh"]
];

function execute() {
    var r = fetchTruyenchuPage(BASE_URL + "/");
    if (!r.error) {
        var data = [];
        var seen = {};
        var links = r.doc.select(".genres_wrap a[href*='/the-loai/']");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "").trim();
            var m = href.match(/\/the-loai\/([a-z0-9\-]+)\/?/);
            if (!m) continue;
            if (seen[m[1]]) continue;
            seen[m[1]] = true;
            var title = cleanText(a.text());
            if (!title) continue;
            data.push({ title: title, input: normalizeUrl(href), script: "gen.js" });
        }
        if (data.length > 0) return Response.success(data);
    }

    var out = [];
    for (var j = 0; j < FALLBACK_GENRES.length; j++) {
        out.push({
            title: FALLBACK_GENRES[j][0],
            input: BASE_URL + "/the-loai/" + FALLBACK_GENRES[j][1] + "/",
            script: "gen.js"
        });
    }
    return Response.success(out);
}
