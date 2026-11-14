// page.js — Phan trang muc luc: tra danh sach URL cac trang muc luc.
// Muc luc 20 chuong/trang, ?chapters_page=N. Trang 1 la URL chi tiet goc.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var qPos = storyUrl.indexOf("?");
    var baseUrl = qPos === -1 ? storyUrl : storyUrl.substring(0, qPos);
    var rr = ttlFetchDoc(baseUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var maxPage = 1;
    var links = doc.select(".tgv-pagination a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var text = cleanText(a.text());
        if (!/^\d+$/.test(text)) continue;
        var href = a.attr("href") || "";
        var m = /[?&]chapters_page=(\d+)/.exec(href);
        if (!m) continue;
        var n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxPage) maxPage = n;
    }
    var pages = [baseUrl];
    for (var p = 2; p <= maxPage; p++) {
        pages.push(baseUrl + "?chapters_page=" + p);
    }
    return Response.success(pages);
}
