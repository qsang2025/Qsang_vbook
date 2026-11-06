// search.js — tim kiem theo tu khoa cua 笔趣阁 (biquge.tw).
// GET /search/?searchkey=<URL-encode> (da kiem chung: tim "凡人修仙传"
// tra 500 ket qua; trang 1 co link 下一頁 -> ?searchkey=...&page=2).
// Item <div class="result-card"> (cover .book-cover img, a.book-title,
// .book-meta .author + .badge trang thai, .book-intro mo ta).
// Phan trang: co link 下一頁 (phon the; phong them 下一页 gian the)
// thi tra String(n+1), khong thi "".
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
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var url = BASE_URL + "/search/?searchkey=" + encodeURIComponent(query);
    if (n > 1) url += "&page=" + n;

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var items = [];
    var seen = {};
    doc.select(".result-card").forEach(function (el) {
        var item = parseSearchItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var next = "";
    var nextLink = doc.select("a:contains(下一頁)").first();
    if (nextLink === null) nextLink = doc.select("a:contains(下一页)").first();
    if (nextLink !== null) next = String(n + 1);

    return Response.success(items, next);
}
