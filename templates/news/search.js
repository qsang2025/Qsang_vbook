// search.js — danh sach bai cho tab home/genre + tim kiem tu khoa
// (template news). Query bat dau bang "/" hoac "http" thi coi la duong
// dan chuyen muc, khong phai tu khoa. Cham mot bai thi app chay thang
// article.js voi link cua bai (loai news khong co trang detail).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function listUrl(query, page) {
    var p = parseInt(page, 10);
    if (!(p >= 1)) p = 1;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : BASE_URL + query;
        return base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + p;
    }
    return BASE_URL + "/tim-kiem?q=" + encodeURIComponent(query) + "&page=" + p;
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var url = listUrl(query, page);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được danh sách bài: " + url);

    var items = [];
    doc.select("SELECTOR_RESULT_ITEMS").forEach(function (el) {
        var a = el.select("SELECTOR_ITEM_LINK a").first();
        if (a === null) return;
        var href = String(a.attr("href") || "");
        if (!href) return;
        var img = el.select("SELECTOR_ITEM_COVER img").first();
        items.push({
            name: cleanText(el.select("SELECTOR_ITEM_NAME").text()),
            link: absUrl(href),
            cover: img !== null ? String(img.attr("src") || "") : "",
            description: cleanText(el.select("SELECTOR_ITEM_LEAD").text()),
            author: cleanText(el.select("SELECTOR_ITEM_AUTHOR").text()),
            time: cleanText(el.select("SELECTOR_ITEM_TIME").text())
        });
    });
    if (items.length === 0) return Response.success([], "");

    var p = parseInt(page, 10);
    if (!(p >= 1)) p = 1;
    return Response.success(items, String(p + 1));
}
