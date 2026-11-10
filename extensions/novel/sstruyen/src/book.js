// book.js — Renderer danh sach truyen dung chung cho SS Truyen (sstruyen.net).
//
// Dung cho cac tab home.js / genre.js: input la duong dan chuyen muc
// (VD `/truyen-moi`, `/the-loai/huyen-huyen`) hoac URL day du.
// Trang danh sach dung card `article.archive-story-card` (20/trang),
// phan trang dang `/page/N` (xem helper.js: parseStoryList/ssPagedUrl/ssNextPage).
// execute(query, page): query la path hoac URL, page la so trang ("1" mac dinh).
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
        url = BASE_URL + "/truyen-moi";
    }
    url = ssPagedUrl(url, page);

    var r = fetchSsDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseStoryList(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    var next = ssNextPage(doc);
    return Response.success(items, next);
}
