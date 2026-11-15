// search.js — Tim kiem truyen (execute(query, page) -> items, next).
//
// API chinh thuc GET /search/api?keyword=<tu khoa>&limit=20&page=<n>
// (kiem chung live 2026-11-15): tra JSON {success, hits, total, page,
// limit}. hits: {articlename, author, url_slug, book_url, fullflag,
// genres, lastchapter}. Tim kiem theo tu khoa (fuzzy): "this world"
// tra 79 ket qua, 20/trang.
// Anh bia khong co trong API — dung theo mau /files/image/<slug>.jpg
// (kiem chung tren 2 truyen that).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    var pageNum = 1;
    if (page !== undefined && page !== null && String(page) !== "") {
        pageNum = parseInt(String(page), 10);
        if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    } else {
        if (!query) return Response.error("Thiếu từ khóa tìm kiếm.");
    }
    var q = query || "";
    var searchUrl = BASE_URL + "/search/api?keyword=" + encodeURIComponent(q) + "&limit=20&page=" + pageNum;
    var r = fetchNnJson(searchUrl);
    if (r.error) return Response.error(r.error);
    var data = r.json;
    if (!data || data.success !== true) {
        return Response.error("Tìm kiếm không trả kết quả.");
    }
    var hits = data.hits || [];
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < hits.length; i++) {
        var h = hits[i];
        var link = h.book_url || "";
        var name = cleanText(h.articlename || "");
        if (!link || !name) continue;
        link = absUrl(link);
        if (seen[link]) continue;
        seen[link] = true;
        var slug = slugOf(link);
        var desc = "";
        var author = cleanText(h.author || "");
        if (author) desc = author;
        var last = cleanText(h.lastchapter || "");
        if (last) desc = desc ? desc + " — " + last : last;
        items.push({
            name: name,
            cover: coverForSlug(slug),
            link: link,
            description: desc,
            tag: h.fullflag === 1 ? "Completed" : "Ongoing"
        });
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào khớp từ khóa.");
    }
    var total = parseInt(data.total, 10) || 0;
    var next = "";
    if (total > pageNum * 20) next = String(pageNum + 1);
    return Response.success(items, next);
}
