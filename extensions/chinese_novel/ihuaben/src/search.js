// search.js — Tim kiem qua so.ihuaben.com/search (100 ket qua/trang).
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    if (!key) return Response.error("Nhập từ khóa để tìm kiếm");
    if (!page) page = "1";
    var q = key;
    try {
        q = encodeURIComponent(key);
    } catch (e) {
    }
    var searchUrl = "https://so.ihuaben.com/search?keyword=" + q + "&page=" + page + "&pageSize=100";
    var rr = ttlFetchDoc(searchUrl, BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var list = [];
    var items = doc.select(".searchresult");
    for (var i = 0; i < items.size(); i++) {
        var el = items.get(i);
        var linkEl = selFirst(el, "h2 a");
        var link = linkEl ? normalizeUrl(linkEl.attr("href") || "") : "";
        var name = linkEl ? cleanText(linkEl.text()) : "";
        var imgEl = selFirst(el, "img");
        var cover = imgEl ? normalizeUrl(imgEl.attr("src") || "") : "";
        var descEl = selFirst(el, ".searchresult-info p");
        var desc = descEl ? cleanText(descEl.text()) : "";
        if (link && name) {
            list.push({ name: name, link: link, host: BASE_URL, cover: cover, description: desc });
        }
    }
    if (list.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa: " + key);

    var next = "";
    var nextEl = selFirst(doc, ".pagination .active + a");
    if (nextEl) {
        var t = cleanText(nextEl.text());
        if (t && /^[0-9]+$/.test(t)) next = t;
    }
    return Response.success(list, next);
}
