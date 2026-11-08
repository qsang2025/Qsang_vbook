// genre.js — Danh sach the loai La Ca Truyen (tu API /api/categories/list kem fallback tinh)
load('config.js');

// GHI CHU: genre.js CO fetch (GET /api/categories/list) — chap nhan duoc vi luon co fallback
// 17 the loai tinh ben duoi, fetch loi khong chan man hinh (khac home.js chi tra tab tinh).

var FALLBACK_GENRES = [
    { title: "Tiên Hiệp", input: "/category/tien-hiep", script: "gen.js" },
    { title: "Huyền Huyễn", input: "/category/huyen-huyen", script: "gen.js" },
    { title: "Đô Thị", input: "/category/do-thi", script: "gen.js" },
    { title: "Khoa Huyễn", input: "/category/khoa-huyen", script: "gen.js" },
    { title: "Hệ Thống", input: "/category/he-thong", script: "gen.js" },
    { title: "Xuyên Không", input: "/category/xuyen-khong", script: "gen.js" },
    { title: "Trọng Sinh", input: "/category/trung-sinh", script: "gen.js" },
    { title: "Linh Dị", input: "/category/linh-di", script: "gen.js" },
    { title: "Võng Du", input: "/category/vong-du", script: "gen.js" },
    { title: "Đồng Nhân", input: "/category/dong-nhan", script: "gen.js" },
    { title: "Võ Hiệp", input: "/category/vo-hiep", script: "gen.js" },
    { title: "Quân Sự", input: "/category/quan-su", script: "gen.js" },
    { title: "Dị Giới", input: "/category/di-gioi", script: "gen.js" },
    { title: "Mạt Thế", input: "/category/mat-the", script: "gen.js" },
    { title: "Ngôn Tình", input: "/category/tinh-cam", script: "gen.js" },
    { title: "Cổ Đại", input: "/category/co-dai", script: "gen.js" },
    { title: "Điền Văn", input: "/category/dien-van", script: "gen.js" }
];

function execute() {
    try {
        var res = fetch(BASE_URL + "/api/categories/list", {
            method: "GET",
            headers: buildAuthHeaders()
        });
        if (res && res.ok) {
            var json = res.json();
            var data = (json && Array.isArray(json.data)) ? json.data : [];
            var out = [];
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                if (!item) continue;
                var title = String(item.title || item.category_title || item.name || "").trim();
                var slug = String(item.slug || item.category_slug || "").trim();
                if (!title || !slug) continue;
                out.push({
                    title: title,
                    input: "/category/" + slug,
                    script: "gen.js"
                });
            }
            if (out.length > 0) {
                return Response.success(out);
            }
        }
    } catch (e) {
    }
    return Response.success(FALLBACK_GENRES);
}
