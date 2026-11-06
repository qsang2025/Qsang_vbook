// search.js — tim kiem theo tu khoa cua Truyen Full.
// Site tim kiem bang /?s=<tu khoa>&post_type=tv6_story (WordPress),
// 20 truyen/trang, phan trang dang /page/N/?s=<kw>&post_type=tv6_story
// (khao sat 2026-11-06, tu khoa "cuc dao thien ma" tra ve truyen mau o
// vi tri dau). Trang ket qua co day du link phan trang nen tinh trang ke
// tu link /page/N/ lon nhat (xem parseListPage trong helper.js).
// Neu query la duong dan (/danh-sach/... hoac URL day du) thi duyet thang
// trang do nhu mot tab danh sach.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var cur = parseInt(page, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var baseUrl = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet tab: query la duong dan chuyen muc hoac URL day du.
        baseUrl = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else {
        // Tu khoa: /?s=<kw>&post_type=tv6_story
        baseUrl = BASE_URL + "/?s=" + encodeURIComponent(query) + "&post_type=tv6_story";
    }
    var url = listPageUrl(baseUrl, String(cur));

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var parsed = parseListPage(doc, String(cur));
    return Response.success(parsed.items, parsed.next);
}
