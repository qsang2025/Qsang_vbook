// book.js — renderer danh sach dung chung cua 小說狂人 (czbooks.net).
// home.js / genre.js / detail.js (genres) tro ve day. Nhan query la
// duong dan danh sach (hoac URL day du):
//   the loai: /c/{slug} (mac dinh sort 最新), 72 item/trang,
//     phan trang /c/{slug}/{page};
//     sort: /c/{slug}/{sort} voi sort = new/day/week/total/finish,
//     phan trang /c/{slug}/{sort}/{page};
//   bang xep hang: /c/normal, /c/all, /c/favorite, /c/finish, /c/hot
//     (mac dinh /day, chi co day/week/total).
// Quy tac chung: trang N>1 = path goc + "/{N}" — ap dung cho ca hai dang.
// Phan trang that cua site: ul.nav.paginate (xem helper.js nextListPath
// — token tra ve la PATH trang ke, vd "/c/xuanhuan/2").
// Item: ul.nav.novel-list > li.novel-item-wrapper
// (xem helper.js parseNovelItem).
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
    page = page || "";

    var path = query;
    if (path.indexOf("http") === 0) {
        var m0 = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = m0 ? m0[1] : path;
    }
    if (path.charAt(0) !== "/") path = "/" + path;

    var pageUrl = "";
    if (page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        pageUrl = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        pageUrl = BASE_URL + path;
        // Trang N>1 = path goc + "/{N}" (the loai va bang deu vay).
        if (n > 1) pageUrl = pageUrl + "/" + n;
    }

    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};
    doc.select("ul.nav.novel-list > li.novel-item-wrapper").forEach(function (el) {
        var item = parseNovelItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    return Response.success(items, nextListPath(doc));
}
