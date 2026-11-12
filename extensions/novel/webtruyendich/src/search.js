// search.js — tim truyen qua API /api/search-novels?keyword=...&page=...
// Tra JSON {novels: [...], page, total_pages}, 20 truyen/trang.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load("config.js");
load("rate-limit.js");

function execute(input, page) {
    var keyword = String(input || "").trim();
    if (!keyword) return Response.success([]);
    var curPage = parseInt(page || "1", 10);
    if (isNaN(curPage) || curPage < 1) curPage = 1;

    var searchUrl = BASE_URL + "/api/search-novels?keyword=" + encodeURIComponent(keyword) + "&page=" + curPage;
    var r = pacedFetch(searchUrl, {
        headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json, text/plain, */*" }
    });
    if (!r.ok) {
        if (r.status === 429 || r.status === 405) {
            return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(searchUrl), r.cooldownRemainingMs));
        }
        if (r.status) return Response.error("Không tìm được truyện (HTTP " + r.status + ").");
        return Response.error("Không tìm được truyện (lỗi mạng).");
    }
    var json = null;
    try {
        json = r.res.json();
    } catch (e) {
        json = null;
    }
    if (!json) return Response.success([]);

    var dataArr = json.novels || json.data || json.items || (Array.isArray(json) ? json : []);
    var books = [];
    for (var i = 0; i < dataArr.length; i++) {
        var bk = toBook(dataArr[i]);
        if (bk && bk.name && bk.link) books.push(bk);
    }

    var nextPage = "";
    var current = json.page || json.current_page || curPage;
    var last = json.total_pages || json.last_page;
    if (last && current < last) {
        nextPage = String(current + 1);
    } else if (books.length >= 20) {
        nextPage = String(curPage + 1);
    }
    return Response.success(books, nextPage);
}
