// search.js — tim kiem tu khoa (/?s=) va renderer danh sach cho
// tab home/genre (duong dan /the-loai/..., /popular-tag/...,
// /phim-le/, /hoan-thanh/, /danh-gia-cao/, /lich-chieu/; input "/"
// la trang chu — chi lay muc "PHIM MOI CAP NHAT").
// Phan trang: token la duong dan day du (/page/N/); truyen lai lam
// doi so page de mo trang tiep theo.
// Nap: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function parseHomeUpdates(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("a.movie-card-update1");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseUpdateCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}

function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query);
    page = String(page === undefined || page === null ? "" : page);
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    // Token phan trang: duong dan day du (/page/N/) hoac URL day du.
    if (page && (page.indexOf("/") === 0 || page.indexOf("http") === 0)) {
        var pageUrl = page.indexOf("http") === 0 ? normalizeUrl(page) : (BASE_URL + page);
        rateLimitDelay(siteOrigin(), 400, 1000);
        var pdoc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
        if (!pdoc) return Response.error("Không tải được trang tiếp theo: " + pageUrl);
        var pparsed = parseListPage(pdoc);
        if (pparsed.items.length === 0) return Response.success([], "");
        return Response.success(pparsed.items, pparsed.next);
    }

    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : (BASE_URL + query);
        rateLimitDelay(siteOrigin(), 400, 1000);
        var doc = fetchDocWithFallback(base, MIRROR_LIST);
        if (!doc) return Response.error("Không tải được danh sách phim: " + base);
        if (query === "/") {
            var homeItems = parseHomeUpdates(doc);
            if (homeItems.length === 0) return Response.success([], "");
            return Response.success(homeItems, "");
        }
        var parsed = parseListPage(doc);
        if (parsed.items.length === 0) return Response.success([], "");
        return Response.success(parsed.items, parsed.next);
    }

    var searchUrl = BASE_URL + "/?s=" + encodeURIComponent(query);
    rateLimitDelay(siteOrigin(), 400, 1000);
    var sdoc = fetchDocWithFallback(searchUrl, MIRROR_LIST);
    if (!sdoc) return Response.error("Không tìm kiếm được: " + query);
    var sparsed = parseListPage(sdoc);
    if (sparsed.items.length === 0) return Response.success([], "");
    return Response.success(sparsed.items, sparsed.next);
}
