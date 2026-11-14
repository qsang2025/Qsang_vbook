// search.js — tim kiem + danh sach (wfxs.tw).
// 2 che do (theo template chinese_novel):
//  - Query bat dau bang "/" hoac "http": duyet trang danh sach
//    (tab home / the loai). Trang top dung markup .rec_rullist (50
//    truyen/trang, phan trang /topallvisit/<n>.html); trang the loai dung
//    .shuku_list .shulist (20 truyen/trang, phan trang /<slug>/<n>/).
//  - Query thuong: tim kiem tu khoa qua /s.html?type=articlename&s=<kw>,
//    ket qua .result-card (20/trang), phan trang ?page=<n>.
// Phan trang: doc ".pages" (dang "第 N / M 頁") hoac ".pagination
// .page-current" (dang "N / M"); token trang ke la so trang dang string,
// "" khi het.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// Ghe so trang vao URL trang danh sach, theo dung dang URL cua site.
function listPageUrl(baseUrl, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n === 1) return baseUrl;
    // Trang top: /topallvisit/1.html -> /topallvisit/2.html
    if (/\/\d+\.html$/.test(baseUrl)) {
        return baseUrl.replace(/\/\d+\.html$/, "/" + n + ".html");
    }
    // Trang the loai: /xianxiaxuanhuan/ -> /xianxiaxuanhuan/2/
    // (neu da co so trang thi thay so do)
    var u = baseUrl.replace(/\/\d+\/$/, "/");
    if (u.charAt(u.length - 1) !== "/") u += "/";
    return u + n + "/";
}

// Parse 1 dong truyen trong trang danh sach (ca 2 markup).
function parseListRow(row) {
    var titleEl = safeFirst(row.select(".three a"));
    if (!titleEl) return null;
    var title = cleanText(titleEl.text());
    var link = absUrl(titleEl.attr("href"));
    if (!title || !link) return null;

    var authorEl = safeFirst(row.select(".four"));
    if (!authorEl) authorEl = safeFirst(row.select(".five"));
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var catEl = safeFirst(row.select(".two"));
    var category = catEl ? cleanText(catEl.text()) : "";
    var statusEl = safeFirst(row.select(".seven"));
    var status = statusEl ? cleanText(statusEl.text()) : "";
    var updateEl = safeFirst(row.select(".eight"));
    if (!updateEl) updateEl = safeFirst(row.select(".six"));
    var update = updateEl ? cleanText(updateEl.text()) : "";

    var desc = "";
    if (author) desc += "作者: " + author;
    if (category) desc += (desc ? " | " : "") + category;
    if (status) desc += (desc ? " | " : "") + status;
    if (update) desc += (desc ? " | " : "") + update;

    return {
        name: title,
        cover: "",
        link: link,
        description: desc,
        host: siteOrigin()
    };
}

// Parse 1 ket qua tim kiem (.result-card).
function parseSearchCard(card) {
    var titleEl = safeFirst(card.select(".book-title"));
    if (!titleEl) return null;
    var title = cleanText(titleEl.text());
    var link = absUrl(titleEl.attr("href"));
    if (!title || !link) return null;

    var authorEl = safeFirst(card.select(".book-meta .author"));
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var coverEl = safeFirst(card.select(".book-cover img"));
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("src") || "";
        if (cover && cover.indexOf("http") !== 0) cover = absUrl(cover);
    }
    var introEl = safeFirst(card.select(".book-intro"));
    var intro = introEl ? cleanText(introEl.text()) : "";
    var latestEl = safeFirst(card.select(".latest a"));
    var latest = latestEl ? cleanText(latestEl.text()) : "";

    var desc = "";
    if (author) desc += "作者: " + author;
    if (intro) desc += (desc ? " | " : "") + intro;
    if (latest) desc += (desc ? " | " : "") + "最新: " + latest;

    return {
        name: title,
        cover: cover,
        link: link,
        description: desc,
        host: siteOrigin()
    };
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var isList = query.indexOf("/") === 0 || query.indexOf("http") === 0;
    var url = "";
    if (isList) {
        var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
        url = listPageUrl(base, pageNum);
    } else {
        url = BASE_URL + "/s.html?type=articlename&s=" + encodeURIComponent(query);
        if (pageNum > 1) url += "&page=" + pageNum;
    }

    var doc = fetchDocPaced(url);
    if (!doc) return Response.error("Không tải được trang (" + lastFetchError + "): " + url);

    var items = [];
    var seen = {};
    var rows = null;
    var i = 0;
    if (isList) {
        rows = doc.select(".rec_rullist ul, .shuku_list .shulist ul");
        for (i = 0; i < rows.size(); i++) {
            var item = parseListRow(rows.get(i));
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        }
    } else {
        rows = doc.select(".result-card");
        for (i = 0; i < rows.size(); i++) {
            var card = parseSearchCard(rows.get(i));
            if (card && !seen[card.link]) {
                seen[card.link] = true;
                items.push(card);
            }
        }
    }

    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào" + (isList ? " trong mục này" : " với từ khóa \"" + query + "\""));
    }

    var info = parsePageInfo(doc);
    var next = "";
    if (info.total > info.current) next = String(info.current + 1);
    return Response.success(items, next);
}
