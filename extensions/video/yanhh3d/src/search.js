// search.js — tim kiem tu khoa (AJAX suggest) va renderer danh sach cho
// tab home/genre (/moi-cap-nhat, /hoat-hinh-ai, /the-loai/...).
// Nap: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function parseSuggestHtml(html) {
    var items = [];
    var seen = {};
    var blocks = String(html || "").split("<li>");
    var i = 0;
    for (i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var am = b.match(/<a[^>]*title="([^"]+)"[^>]*href="([^"]+)"/i);
        if (!am) continue;
        var name = cleanText(am[1].replace(/&amp;/g, "&"));
        var href = String(am[2] || "").replace(/\\\//g, "/");
        if (!name || !href) continue;
        var link = absUrl(href).replace(/\/+$/, "");
        if (seen[link]) continue;
        seen[link] = true;
        var cover = "";
        var im = b.match(/<img[^>]*src="([^"]+)"/i);
        if (im && im[1]) cover = unwrapCover(im[1].replace(/\\\//g, "/"));
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: "",
            tag: "",
            host: ""
        });
    }
    return items;
}

function execute(query, page) {
    query = String(query === undefined || query === null ? "" : query);
    page = String(page === undefined || page === null || page === "" ? "1" : page);
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : (BASE_URL + query);
        var url = pageUrl(base, page);
        rateLimitDelay(siteOrigin(), 400, 1000);
        var doc = fetchDocWithFallback(url, MIRROR_LIST);
        if (!doc) return Response.error("Không tải được danh sách phim: " + url);
        var parsed = parseListPage(doc, page);
        if (parsed.items.length === 0) return Response.success([], "");
        return Response.success(parsed.items, parsed.next);
    }

    var apiUrl = BASE_URL + "/ajax/search/suggest?ajaxSearch=1&keysearch=" + encodeURIComponent(query);
    var r = null;
    try {
        r = pacedFetch(apiUrl, {
            headers: { "Accept": "application/json" },
            referer: BASE_URL + "/",
            minDelayMs: 0,
            maxDelayMs: 0,
            maxRetries: 0,
            timeout: 10000
        });
    } catch (e) {
        return Response.error("Không tìm kiếm được: " + query);
    }
    if (!r || !r.ok || !r.res) return Response.error("Không tìm kiếm được: " + query);
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return Response.error("Không đọc được kết quả tìm kiếm."); }
    if (!text || isChallengeText(text)) return Response.error("Không tìm kiếm được: " + query);
    var obj = null;
    try {
        obj = JSON.parse(text);
    } catch (e3) {
        return Response.error("Không đọc được kết quả tìm kiếm.");
    }
    if (!obj || obj.code !== 1 || !obj.data) return Response.success([], "");
    var items = parseSuggestHtml(obj.data);
    return Response.success(items, "");
}
