// genre.js — Doc the loai live tu menu mega cua trang chu (37 the loai,
// kiem chung 2026-11-13). The loai nam trong dropdown .gd-mega-cats dang
// a[href="https://ztruyen.vn/<slug>/"]. Neu fetch that bai thi dung
// fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Cổ Đại", "co-dai"], ["Cung Đấu", "cung-dau"], ["Dị Giới", "di-gioi"],
    ["Drama", "drama"], ["Đam Mỹ", "dam-my"], ["Điền Văn", "dien-van"],
    ["Đô Thị", "do-thi"], ["Đoản Văn", "doan-van"], ["Đông Phương", "dong-phuong"],
    ["Gia Đấu", "gia-dau"], ["Hài Hước", "hai-huoc"], ["Hệ Thống", "he-thong"],
    ["Hiện đại", "hien-dai"], ["Huyền Huyễn", "huyen-huyen"], ["Khác", "khac"],
    ["Khoa Huyễn", "khoa-huyen"], ["Kiếm Hiệp", "kiem-hiep"], ["Lịch Sử", "lich-su"],
    ["Linh Dị", "linh-di"], ["Mạt Thế", "mat-the"], ["Ngôn Tình", "ngon-tinh"],
    ["Ngược", "nguoc"], ["Nữ Cường", "nu-cuong"], ["Nữ Phụ", "nu-phu"],
    ["Phương Tây", "phuong-tay"], ["Quan Trường", "quan-truong"],
    ["School Life", "school-life"], ["Slice of life", "slice-of-life"],
    ["Sủng", "sung"], ["Thám Hiểm", "tham-hiem"], ["Tiên Hiệp", "tien-hiep"],
    ["Trọng Sinh", "trong-sinh"], ["Truyện Teen", "truyen-teen"],
    ["Võng Du", "vong-du"], ["Xuyên Không", "xuyen-khong"],
    ["Xuyên Nhanh", "xuyen-nhanh"], ["Xuyên sách", "xuyen-sach"]
];

function execute() {
    var r = fetchZtruyenPage(BASE_URL + "/");
    if (!r.error) {
        var data = [];
        var seen = {};
        var links = r.doc.select(".gd-mega-cats a[href^=\"https://ztruyen.vn/\"]");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "").trim();
            var m = href.match(/^https:\/\/ztruyen\.vn\/([a-z0-9\-]+)\/$/);
            if (!m) continue;
            if (seen[href]) continue;
            seen[href] = true;
            var title = cleanText(a.text());
            if (!title) continue;
            data.push({ title: title, input: href, script: "gen.js" });
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
