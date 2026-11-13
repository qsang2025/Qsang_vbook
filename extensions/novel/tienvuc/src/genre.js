// genre.js — Doc the loai live tu /api/categories/all (39 the loai,
// kiem chung 2026-11-13). Neu API loi thi dung fallback cung.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var FALLBACK_GENRES = [
    ["Tiên Hiệp", "tien-hiep"], ["Ngôn Tình", "ngon-tinh"],
    ["Huyền Huyễn", "huyen-huyen"], ["Đô Thị", "do-thi"],
    ["Xuyên Không", "xuyen-khong"], ["Trọng Sinh", "trong-sinh"],
    ["Dị Giới", "di-gioi"], ["Hệ Thống", "he-thong"],
    ["Võng Du", "vong-du"], ["Đồng Nhân", "dong-nhan"],
    ["Hài Hước", "hai-huoc"], ["Hiện Đại", "hien-dai"],
    ["Võ Hiệp", "vo-hiep"], ["Linh Dị", "linh-di"],
    ["Trinh Thám", "trinh-tham"], ["Quân Sự", "quan-su"],
    ["Khoa Huyễn", "khoa-huyen"], ["Lịch Sử", "lich-su"],
    ["Hồng Hoang", "hong-hoang"], ["Mạt Thế", "mat-the"]
];

function execute() {
    var r = fetchTvApi("/api/categories/all");
    if (!r.error && r.json) {
        var list = r.json;
        if (list && list.length !== undefined) {
            var data = [];
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (item && item.slug && item.name) {
                    data.push({ title: item.name, input: item.slug, script: "cate.js" });
                }
            }
            if (data.length > 0) return Response.success(data);
        }
    }

    var out = [];
    for (var j = 0; j < FALLBACK_GENRES.length; j++) {
        out.push({
            title: FALLBACK_GENRES[j][0],
            input: FALLBACK_GENRES[j][1],
            script: "cate.js"
        });
    }
    return Response.success(out);
}
