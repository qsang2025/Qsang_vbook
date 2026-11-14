// book.js — renderer danh sach dung chung cua Bqgoo (bqgooo.cc).
// home.js / genre.js / detail.js tro ve day. Input:
//   "hotlist" | "toplist" | "uplist" | "addlist"
//       -> GET /api/index?sort=index, lay danh sach co ten tuong ung
//          (hotlist 4 truyen, toplist 9, uplist 30, addlist 30).
//   "sort:<key>" (vd. "sort:xuanhuan")
//       -> GET /api/sort?sort=<key>, tra 150 truyen.
// Khong phan trang: API tra toan bo danh sach trong 1 lan goi.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// rate-limit.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    var path = "";
    var data = null;
    var isSort = query.indexOf("sort:") === 0;

    if (isSort) {
        var key = query.substring(5);
        if (!key) return Response.error("Thể loại không hợp lệ");
        path = "/api/sort?sort=" + encodeURIComponent(key);
    } else if (query === "hotlist" || query === "toplist" ||
               query === "uplist" || query === "addlist") {
        path = "/api/index?sort=index";
    } else {
        return Response.error("Danh sách không hợp lệ: " + query);
    }

    rateLimitDelay("apibi.cc");
    var j = fetchJsonWithFallback(path);
    if (!j) return Response.error("Không tải được danh sách: " + BASE_URL + path);

    if (isSort) {
        data = j.data || [];
    } else {
        data = j[query] || [];
    }

    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < data.length; i++) {
        var item = bookItem(data[i]);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    if (items.length === 0) {
        return Response.error("Danh sách trống: " + query);
    }

    return Response.success(items, "");
}
