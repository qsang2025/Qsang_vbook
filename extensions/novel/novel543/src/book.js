// book.js — renderer danh sach dung chung cua 稷下書院 (novel543.com).
// home.js / genre.js tro ve day. Nhan query la duong dan danh sach
// (hoac URL day du): /bookstack/, /bookstack/<slug>/ (18 truyen/trang,
// phan trang ?page=N), /ranking/0-8-8001.html (bang xep hang, 40
// truyen/trang, phan trang ?page=N).
// Item chinh: ul.list > li.media (xem helper.js parseBookItem).
// Token trang ke: href cua link pager "»" (vd "/bookstack/?page=2");
// luot goi sau nhan page bat dau bang "/" thi fetch thang path do.
// Du phong neu khong tim thay link ke: trang day (>= 18 item) thi doan
// ?page=N+1 (chi khi page hien tai la so).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function nextPathToken(doc) {
    var nextLink = doc.select("a:contains(»)").first();
    if (nextLink !== null) {
        var href = nextLink.attr("href");
        if (href) {
            if (href.indexOf("http") === 0) {
                var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
                return m ? m[1] : "";
            }
            if (href.charAt(0) === "/") return href;
        }
    }
    return "";
}

function pageUrlWithNumber(path, n) {
    if (path.indexOf("?") !== -1) return BASE_URL + path + "&page=" + n;
    return BASE_URL + path + "?page=" + n;
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

    var pageUrl = "";
    var n = 1;
    if (page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        pageUrl = BASE_URL + page;
    } else {
        n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        if (n === 1) {
            pageUrl = BASE_URL + path;
        } else {
            pageUrl = pageUrlWithNumber(path, n);
        }
    }

    rateLimitDelay("www.novel543.com");
    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};
    doc.select("ul.list > li.media").forEach(function (el) {
        var item = parseBookItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    // Du phong: mot so trang list dung selector khac (khong co ul.list).
    if (items.length === 0) {
        doc.select("li.media").forEach(function (el) {
            var item = parseBookItem(el);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        });
    }

    var next = nextPathToken(doc);
    if (!next && page.charAt(0) !== "/" && items.length >= 18) {
        next = pageUrlWithNumber(path, n + 1).replace(/^https?:\/\/[^\/]+/, "");
    }

    return Response.success(items, next);
}
