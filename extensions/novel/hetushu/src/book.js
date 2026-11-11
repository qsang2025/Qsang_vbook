// book.js — renderer danh sach dung chung cua 和图书 (hetushu.com).
// home.js / genre.js tro ve day. Nhan query la duong dan danh sach
// (hoac URL day du):
//   /book/index.php (toan bo truyen, mac dinh 完本 len truoc),
//   /book/index.php?type=<the-loai-url-encoded> (13 the loai),
//   /book/index.php?state=2 (完本) / ?state=1 (连载),
//   /top/index.php (bang xep hang, 20 truyen, 1 trang duy nhat).
// Danh sach the loai: ul#list.book_list > li, 16 truyen/trang, phan
// trang ?page=N / &page=N (xem helper.js parseGenreItem). Bang xep hang:
// dl.list#body > dd, khong phan trang (xem helper.js parseDdItem).
// Token trang ke: so trang dang chuoi ("2", "3", ...); luot goi sau
// nhan page la so thi ghep ?page=N / &page=N tuy URL da co query.
// Khao sat 2026-11-10: trang the loai co div.page chua link cac trang;
// chi tra token khi co link toi trang ke (tranh lap vo han o trang cuoi).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function pageUrlWithNumber(path, n) {
    if (path.indexOf("?") !== -1) return BASE_URL + path + "&page=" + n;
    return BASE_URL + path + "?page=" + n;
}

// Co link phan trang toi trang n+1 trong div.page khong.
function hasPageLink(doc, n) {
    var found = false;
    doc.select("div.page a").forEach(function (a) {
        var href = a.attr("href") || "";
        if (href.indexOf("page=" + n) !== -1) found = true;
    });
    return found;
}

function execute(query, page) {
    query = query || "";
    page = page || "";

    var path = query;
    if (path.indexOf("http") === 0) {
        var m0 = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = m0 ? m0[1] : path;
    }
    if (path.charAt(0) !== "/") path = "/" + path;

    var n = 1;
    n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var pageUrl = "";
    if (n === 1) {
        pageUrl = BASE_URL + path;
    } else {
        pageUrl = pageUrlWithNumber(path, n);
    }

    rateLimitDelay("www.hetushu.com");
    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};
    var isTop = path.indexOf("/top/") === 0;
    if (isTop) {
        doc.select("dl#body > dd").forEach(function (el) {
            var item = parseDdItem(el);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        });
    } else {
        doc.select("ul#list > li").forEach(function (el) {
            var item = parseGenreItem(el);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        });
        // Du phong: mot so trang list dung selector khac.
        if (items.length === 0) {
            doc.select("dl#body > dd").forEach(function (el) {
                var item = parseDdItem(el);
                if (item && !seen[item.link]) {
                    seen[item.link] = true;
                    items.push(item);
                }
            });
        }
    }

    // Bang xep hang chi 1 trang. Trang the loai: token khi co link page=n+1.
    var next = "";
    if (!isTop && hasPageLink(doc, n + 1)) next = String(n + 1);

    return Response.success(items, next);
}
