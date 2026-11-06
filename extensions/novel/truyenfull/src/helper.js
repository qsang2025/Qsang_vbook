// helper.js — ham phu cua extension Truyen Full (truyenfull.link).
//
// Ham rieng cho site nay (khao sat 2026-11-06):
//   - Dong truyen trong trang danh sach la mot .row co itemtype Book:
//     h3.truyen-title a (ten + link), img.cover (anh bia),
//     span.author a (tac gia), div.col-xs-2 a (chuong moi nhat).
//   - Phan trang dang /page/N/ (ca danh sach, the loai va tim kiem);
//     tim kiem dung /page/N/?s=<kw>&post_type=tv6_story.
//   - URL chuong dang /chuong/<slug>-chuong-<so>/.
//   - Slug truyen tu URL dang /truyen/<slug>/.
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('config-helpers.js');
//     load('helper.js');
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js TRUOC helper.js vi cac ham duoi
// day dung BASE_URL (absUrl) va cleanText (config-helpers.js phai duoc
// load truoc helper.js neu script dung cleanText — cac script deu load
// config-helpers.js truoc helper.js). Build se copy file nay vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Slug truyen tu URL dang /truyen/<slug> (bo query).
function bookSlug(url) {
    var m = String(url || "").match(/\/truyen\/([^\/\?#]+)/);
    return m ? m[1] : "";
}

// So chuong tu URL dang /chuong/<slug>-chuong-<so>/ (vd chuong-48).
// Tra ve 0 neu khong tach duoc.
function chapterNumber(url) {
    var m = String(url || "").match(/chuong-(\d+)\/?$/);
    return m ? parseInt(m[1], 10) : 0;
}

// Ghe so trang vao URL danh sach dang /page/N/ cua site nay (WordPress).
// Trang 1 tra URL goc. URL co query (?s=...&post_type=...) thi chen
// /page/N/ TRUOC dau "?" (vd /page/2/?s=kw&post_type=tv6_story).
function listPageUrl(baseUrl, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n === 1) return baseUrl;
    var q = baseUrl.indexOf("?");
    var path = q === -1 ? baseUrl : baseUrl.substring(0, q);
    var query = q === -1 ? "" : baseUrl.substring(q);
    path = path.replace(/\/+$/, "");
    return path + "/page/" + n + "/" + query;
}

// Parse MOT dong truyen trong trang danh sach /danh-sach, /the-loai,
// ket qua tim kiem. Tra ve doi tuong item hoac null neu khong phai dong
// truyen. Dong la .row co itemtype Book: h3.truyen-title a (ten + link),
// img.cover (anh bia), span.author a (tac gia), div.col-xs-2 a (chuong
// moi nhat, dung lam tag).
function parseBookRow(row) {
    var titleEl = row.select("h3.truyen-title a").first();
    if (titleEl === null) return null;
    var href = titleEl.attr("href");
    var name = cleanText(titleEl.text()) || cleanText(titleEl.attr("title"));
    if (!href || !name) return null;

    var img = row.select("img.cover").first();
    var cover = "";
    if (img !== null) {
        cover = img.attr("src") || img.attr("data-src") || "";
        if (cover) cover = absUrl(cover);
    }

    var authorEl = row.select("span.author a").first();
    var author = authorEl === null ? "" : cleanText(authorEl.text());

    var latestEl = row.select("div.col-xs-2 a").first();
    var tag = latestEl === null ? "" : cleanText(latestEl.text());

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: author,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse ca trang danh sach (dung chung cho home/genre/search).
// currentPage: so trang hien tai (mac dinh 1). Tra ve { items, next }.
// next = so trang ke ("") = het; tinh tu link phan trang /page/N/ lon
// nhat trong trang (pager cua site hien ca link trang cuoi, vd /page/646/).
function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    doc.select(".list-truyen .row").forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var maxPage = cur;
    doc.select("a[href]").forEach(function (a) {
        var m = String(a.attr("href")).match(/\/page\/(\d+)\//);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    });

    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}
