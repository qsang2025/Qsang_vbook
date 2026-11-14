// gen.js — Script list dung chung cho home/genre (execute(query, page) -> items, nextPage).
//
// query la mot trong:
//   "newest" -> /newest/ (moi cap nhat), "sort" -> /sort/ (bang xep hang),
//   "home"   -> / (trang chu, chi trang 1),
//   "<slug the loai>" -> /<slug>/ (vd. "dsyq").
// Phan trang theo kieu Bixiange: /{section}/index_{N}.html.
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.error("Thiếu mục danh sách.");
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var fetchUrl = "";
    if (query === "home") {
        if (p > 1) return Response.success([], "");
        fetchUrl = BASE_URL + "/";
    } else if (query === "newest" || query === "sort") {
        fetchUrl = paginateUrl(query, p);
    } else if (CAT_SLUGS.indexOf(query) !== -1) {
        fetchUrl = paginateUrl(query, p);
    } else {
        return Response.error("Mục danh sách không hợp lệ: " + query);
    }

    var r = fetchBxDoc(fetchUrl);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.success([], "");
    var next = "";
    if (query !== "home") next = getNextPage(r.doc, p);
    return Response.success(items, next);
}
