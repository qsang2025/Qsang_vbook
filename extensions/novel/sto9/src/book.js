// book.js — renderer danh sach dung chung cua 思兔閱讀 (sto9.com).
// home.js / genre.js tro ve day. Nhan query la duong dan danh sach
// (hoac URL day du): /novels/class/{id}_{page}.html (15 truyen/trang),
// /novels/hot, /last (40 truyen, khong phan trang), /novels/full,
// /all.html (1098 truyen, khong phan trang).
// Phan trang that cua site (khao sat 2026-11-07):
//   class: /novels/class/{id}_{N}.html
//   hot:   /novels/newhot_0_0_{N}.html
//   full:  /novels/full/0_{N}.html
// Pager khong co chu 下一頁 — nut trang ke la <a class="next"> (chu ">").
// Token trang ke tra ve la PATH cua link ke (vd "/novels/class/0_6.html");
// luot goi sau nhan page bat dau bang "/" thi fetch thang path do, nen
// khong can doan pattern khi theo link that.
// Item chinh: ul#article_list_content > li (xem helper.js parseBookItem).
// Du phong: /last dung .recentupdate2 li (ten + chuong moi + ngay, khong
// cover); /all.html dung .ranking a[href*="/book/"] (chi ten + link).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function nextPathToken(doc) {
    var nextLink = safeFirst(doc.select("a.next"));
    if (nextLink === null) nextLink = safeFirst(doc.select("a:contains(下一頁)"));
    if (nextLink === null) nextLink = safeFirst(doc.select("a:contains(下一页)"));
    if (nextLink === null) return "";
    var href = nextLink.attr("href");
    if (!href) return "";
    if (href.indexOf("http") === 0) {
        var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
        return m ? m[1] : "";
    }
    if (href.charAt(0) === "/") return href;
    return "";
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
    if (page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        pageUrl = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        pageUrl = BASE_URL + path;
        if (n > 1) {
            var mc = path.match(/^\/novels\/class\/(\d+)_\d+\.html$/);
            var mh = path.match(/^\/novels\/newhot_\d+_\d+_\d+\.html$/);
            var mf = path.match(/^\/novels\/full\/\d+_\d+\.html$/);
            if (mc) {
                pageUrl = BASE_URL + "/novels/class/" + mc[1] + "_" + n + ".html";
            } else if (path === "/novels/hot") {
                pageUrl = BASE_URL + "/novels/newhot_0_0_" + n + ".html";
            } else if (path === "/novels/full") {
                pageUrl = BASE_URL + "/novels/full/0_" + n + ".html";
            } else if (mh) {
                pageUrl = BASE_URL + path.replace(/_(\d+)\.html$/, "_" + n + ".html");
            } else if (mf) {
                pageUrl = BASE_URL + path.replace(/_(\d+)\.html$/, "_" + n + ".html");
            } else if (/_\d+\.html$/.test(path)) {
                pageUrl = BASE_URL + path.replace(/_(\d+)\.html$/, "_" + n + ".html");
            }
            // /last va /all.html khong phan trang: giu nguyen URL goc.
        }
    }

    var doc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang danh sách: " + pageUrl);

    var items = [];
    var seen = {};
    doc.select("#article_list_content > li").forEach(function (el) {
        var item = parseBookItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    // Du phong: /last — .recentupdate2 li (ten, chuong moi nhat, ngay).
    if (items.length === 0) {
        doc.select(".recentupdate2 li").forEach(function (el) {
            var a = el.select('a[href*="/book/"]').first();
            if (a === null) return;
            var href = a.attr("href");
            var name = cleanText(a.text());
            if (!href || !name) return;
            var link = absUrl(href);
            if (seen[link]) return;
            seen[link] = true;
            var latest = el.select('a[href*="/txt/"]').first();
            var date = cleanText(el.select("span").text());
            var desc = latest !== null ? cleanText(latest.text()) : "";
            if (date) desc = desc ? desc + " — " + date : date;
            items.push({
                name: htmlDecode(name),
                cover: "",
                link: link,
                description: desc,
                tag: "",
                host: siteOrigin()
            });
        });
    }

    // Du phong: /all.html — .ranking a[href*="/book/"] (chi ten + link).
    if (items.length === 0) {
        doc.select('.ranking a[href*="/book/"]').forEach(function (el) {
            var href = el.attr("href");
            var name = cleanText(el.text());
            if (!href || !name) return;
            var link = absUrl(href);
            if (seen[link]) return;
            seen[link] = true;
            items.push({
                name: htmlDecode(name),
                cover: "",
                link: link,
                description: "",
                tag: "",
                host: siteOrigin()
            });
        });
    }

    return Response.success(items, nextPathToken(doc));
}
