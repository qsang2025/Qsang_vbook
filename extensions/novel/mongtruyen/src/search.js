// search.js — Tim kiem GET /search.html?q=<tu khoa>.
// Site tra 12 ket qua trong .search-results-grid, khong co phan trang.
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    if (!key) return Response.error("Nhập từ khóa để tìm kiếm");
    var q = key;
    try {
        q = encodeURIComponent(key);
    } catch (e) {
    }
    var rr = ttlFetchDoc(BASE_URL + "/search.html?q=" + q);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var list = [];
    var elements = doc.select(".search-results-grid .hydrosite-mong-truyen-book-card");
    for (var i = 0; i < elements.size(); i++) {
        var el = elements.get(i);
        var linkEl = selFirst(el, ".hydrosite-mong-truyen-book-thumbnail a");
        var link = linkEl ? normalizeUrl(linkEl.attr("href") || "") : "";
        var imgEl = selFirst(el, ".hydrosite-mong-truyen-book-thumbnail img");
        var cover = imgEl ? normalizeUrl(imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
        var name = cleanText(selFirst(el, ".hydrosite-mong-truyen-book-title") ? selFirst(el, ".hydrosite-mong-truyen-book-title").text() : "");
        var author = cleanText(selFirst(el, ".hydrosite-mong-truyen-book-author") ? selFirst(el, ".hydrosite-mong-truyen-book-author").text() : "");
        if (name.indexOf("- Chương") !== -1) name = cleanText(name.split("- Chương")[0]);
        if (link && name) {
            list.push({ name: name, link: link, cover: cover, description: author, host: BASE_URL });
        }
    }
    // Site khong co phan trang tim kiem: tra het ket qua mot lan.
    return Response.success(list, "");
}
