// search.js — Tim kiem truyen SS Truyen (sstruyen.net).
//
// Tim kiem theo tu khoa qua `/search?s=<kw>` (canonical — phan trang
// `/search/page/N?s=<kw>`). Neu query la duong dan chuyen muc (bat dau
// bang "/" hoac "http") thi coi nhu duyet danh sach (phong khi tab nao
// do tro thang vao search.js). Ket qua dung card
// `article.archive-story-card` (20/trang) nhu book.js.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url = "";
    if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        url = BASE_URL + query;
    } else if (query) {
        url = BASE_URL + "/search?s=" + encodeURIComponent(query);
    } else {
        return Response.error("Nhập từ khóa để tìm truyện.");
    }
    url = ssPagedUrl(url, page);

    var r = fetchSsDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseStoryList(doc);
    if (items.length === 0) return Response.success([], "");
    var next = ssNextPage(doc);
    return Response.success(items, next);
}
