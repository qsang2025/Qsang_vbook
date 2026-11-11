// search.js — tim kiem theo tu khoa cua 繁體小說 (novels.com.tw).
// GET /search/?searchkey=<URL-encode> (da kiem chung: 100 ket qua,
// khong phan trang, token luon ""). Item <li class="searchresult">
// (cover img.lazy data-original, h3 ten, span the loai/trang thai,
// p.searchresult_p mo ta). Tra du ket qua nhu site tra (khong loc
// truyen nguoi lon — theo yeu cau cua nguoi dung ngay 2026-11-06).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = BASE_URL + "/search/?searchkey=" + encodeURIComponent(query);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var items = [];
    var seen = {};
    doc.select("li.searchresult").forEach(function (el) {
        var item = parseSearchItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    // Site ghi "最多显示100条结果" — khong phan trang, token luon "".
    return Response.success(items, "");
}
