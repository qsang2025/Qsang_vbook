// toc.js — Danh sach chuong: doc tu trang chi tiet (muc luc du 1 lan
// tren trang). Chi lay link trong <section class="listchapterinffo">
// va chi lay link cung host (trang chi tiet co ca link quang cao sang
// domain khac, vd. misacvien.com — phai loai). Thu ?page=N khi co link
// trang sau (truyen nhieu chuong chua kiem chung phan trang).
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var qPos = storyUrl.indexOf("?");
    var baseUrl = qPos === -1 ? storyUrl : storyUrl.substring(0, qPos);

    var chapters = [];
    var seen = {};
    var page = 1;
    while (true) {
        var fetchUrl = page === 1 ? baseUrl : (baseUrl + "?page=" + page);
        var rr = ttlFetchDoc(fetchUrl);
        if (rr.error) {
            if (chapters.length > 0) break;
            return Response.error(rr.error);
        }
        var doc = rr.doc;
        var scope = selFirst(doc, "section.listchapterinffo") || doc;
        var chapLinks = scope.select("a[href*='/doc-truyen/']");
        var added = 0;
        for (var i = 0; i < chapLinks.size(); i++) {
            var a = chapLinks.get(i);
            var href = a.attr("href") || "";
            if (!href) continue;
            if (href.indexOf("http") === 0 && href.indexOf(BASE_URL) !== 0) continue;
            if (seen[href]) continue;
            seen[href] = true;
            var name = cleanText(a.text());
            if (!name) continue;
            var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
            chapters.push({ name: name, url: fullUrl, lock: false, pay: false });
            added++;
        }
        var nextLink = selFirst(doc, "a[href*='?page=" + (page + 1) + "']");
        if (!nextLink || added === 0) break;
        page++;
        if (page > 100) break;
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
