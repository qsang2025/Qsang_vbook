// book.js — renderer danh sach dung chung cua 笔趣阁 (biquge.tw).
// home.js / genre.js tro ve day. Nhan query la duong dan the loai
// "/sort/<slug>/" (hoac URL day du, hoac "/sort/<slug>/<N>.html").
// Phan trang: trang 1 = /sort/<slug>/, trang N>1 = /sort/<slug>/N.html
// (pager cua site: /sort/youxi/2.html, 3.html ... 末页 20.html —
// khao sat 2026-11-06). Token trang ke: co link 下一页 (gian the;
// phong them 下一頁 phon the) thi tra String(n+1), khong thi "".
// Item: <div class="item"> (cover img.lazy data-src, dt a ten,
// dd.author, dd.intro, .cover span the loai/trang thai).
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
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var path = query;
    if (path.indexOf("http") === 0) {
        var m = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = m ? m[1] : path;
    }
    if (path.charAt(0) !== "/") path = "/" + path;
    // Chuan hoa: bo so trang cuoi (neu co) ve dang co so /sort/<slug>/.
    path = path.replace(/\/\d+\.html$/, "/").replace(/\/+$/, "/");

    var pageUrl = BASE_URL + path;
    if (n > 1) {
        pageUrl = BASE_URL + path.replace(/\/$/, "") + "/" + n + ".html";
    }

    var doc = fetchDoc(pageUrl);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};
    doc.select(".item").forEach(function (el) {
        var item = parseBookItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var next = "";
    var nextLink = doc.select("a:contains(下一页)").first();
    if (nextLink === null) nextLink = doc.select("a:contains(下一頁)").first();
    if (nextLink !== null) next = String(n + 1);

    return Response.success(items, next);
}
