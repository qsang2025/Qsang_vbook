// search.js — tim kiem theo tu khoa cua Bqgoo (bqgoo.cc).
// GET /api/search?q=<tu-khoa-url-encoded>. Tra ve
// {data:[{id,title,author,intro}]} — vd. tim "剑来" thi 剑来 (id 1000)
// dung dau tien. Khong co ket qua thi data rong -> tra danh sach rong,
// khong phai loi. Khong phan trang (API chi tra 1 trang).
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
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = BASE_URL + "/api/search?q=" + encodeURIComponent(query);

    rateLimitDelay("apibi.cc");
    var j = fetchJsonWithFallback("/api/search?q=" + encodeURIComponent(query));
    if (!j) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var data = j.data || [];
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

    return Response.success(items, "");
}
