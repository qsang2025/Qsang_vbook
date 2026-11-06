load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
// genre.js — danh sach the loai HHKUNGFU.
// Doc truc tiep tu menu cua trang chu (link /category/<slug>); moi muc
// goi search.js voi `input` la URL the loai day du.
// Du phong: neu menu doi ma khong doc duoc, dung 8 the loai da xac minh
// tren site (2026-11-06).
var FALLBACK_GENRES = [
    { title: "Tu Tiên", input: "/category/tu-tien", script: "search.js" },
    { title: "Kiếm Hiệp", input: "/category/kiem-hiep", script: "search.js" },
    { title: "Hiện Đại", input: "/category/hien-dai", script: "search.js" },
    { title: "Xuyên Không", input: "/category/xuyen-khong", script: "search.js" },
    { title: "Trùng Sinh", input: "/category/trung-sinh", script: "search.js" },
    { title: "Luyện Cấp", input: "/category/luyen-cap", script: "search.js" },
    { title: "Hài Hước", input: "/category/hai-huoc", script: "search.js" },
    { title: "OVA", input: "/category/ova", script: "search.js" }
];

function execute() {
    var response = fetchWithFallback(BASE_URL);
    if (response.ok) {
        var doc = response.html();
        var genres = [];
        var seen = {};
        doc.select("a[href*=\"/category/\"]").forEach(function (el) {
            var href = el.attr("href");
            var title = cleanText(el.text());
            if (!href || !title) return;
            var path = href;
            if (path.indexOf(BASE_URL) === 0) path = path.substring(BASE_URL.length);
            if (!/^\/category\/[^\/]+\/?$/.test(path)) return;
            var full = absUrl(href);
            if (seen[full]) return;
            seen[full] = true;
            genres.push({ title: title, input: full, script: "search.js" });
        });
        if (genres.length > 0) return Response.success(genres);
    }
    return Response.success(FALLBACK_GENRES);
}
