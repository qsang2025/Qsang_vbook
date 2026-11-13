// genre.js — Doc the loai live tu ul.danh-muc a.menu-item cua trang chu
// (54 the loai, kiem chung 2026-11-14). Neu fetch that bai thi dung
// fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Action", "action"], ["Adult", "adult"], ["Adventure", "adventure"],
    ["Báo thù", "bao-thu"], ["BOYLOVE", "boylove"], ["Cổ Đại", "co-dai"],
    ["Cung Đấu", "cung-dau"], ["Đam mỹ", "dam-my"], ["Dị Giới", "di-gioi"],
    ["Điền Văn", "dien-van"], ["Đô Thị", "do-thi"], ["Đoản Văn", "doan-van"],
    ["Drama", "drama"], ["Gia Đấu", "gia-dau"],
    ["giả tưởng khoa học", "gia-tuong-khoa-hoc"], ["Hài Hước", "hai-huoc"],
    ["Harem", "harem"], ["Hệ Thống", "he-thong"], ["Hiện đại", "hien-dai"],
    ["Huyền ảo", "huyen-ao"], ["Huyền Huyễn", "huyen-huyen"],
    ["Khác", "khac"], ["Khoa học viễn tưởng", "khoa-hoc-vien-tuong"],
    ["Khoa Huyễn", "khoa-huyen"], ["kinh dị", "kinh-di"],
    ["Kỳ ảo", "ky-ao"], ["linh dị", "linh-di"], ["Manhwa", "manhwa"],
    ["Mạt Thế", "mat-the"], ["Ngôn Linh", "ngon-linh"],
    ["Ngôn Tình", "ngon-tinh"], ["Ngược", "nguoc"],
    ["Night Owl", "night-owl"], ["Nữ Cường", "nu-cuong"],
    ["Nữ Phụ", "nu-phu"], ["Sắc", "sac"], ["School Life", "school-life"],
    ["Shoujo", "shoujo"], ["Slice of life", "slice-of-life"],
    ["Smut", "smut"], ["Sủng", "sung"], ["Tâm linh", "tam-linh"],
    ["Tâm lý", "tam-ly"], ["Tiên giới", "tien-gioi"],
    ["tiên hiệp", "tien-hiep"], ["Tiểu Thuyết", "tieu-thuyet"],
    ["Trinh Thám", "trinh-tham"], ["Trọng Sinh", "trong-sinh"],
    ["Truyện Chữ", "truyen-chu"], ["Truyện Teen", "truyen-teen"],
    ["Truyện Tranh", "truyen-tranh"], ["Tu Tiên", "tu-tien"],
    ["Xuyên Không", "xuyen-khong"], ["Xuyên sách", "xuyen-sach"]
];

function execute() {
    var r = fetchVivuPage(BASE_URL + "/");
    if (!r.error) {
        var data = [];
        var seen = {};
        var links = r.doc.select("ul.danh-muc a.menu-item");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "").trim();
            if (!href) continue;
            var slug = href.replace(/\/+$/, "").split("/").pop();
            if (!slug || seen[slug]) continue;
            seen[slug] = true;
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
            input: BASE_URL + "/" + FALLBACK_GENRES[j][1] + "/",
            script: "gen.js"
        });
    }
    return Response.success(out);
}
