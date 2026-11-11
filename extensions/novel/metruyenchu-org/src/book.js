// book.js — Renderer danh sach truyen dung chung cho Metruyenchu.org.
//
// Dung cho cac tab home.js / genre.js: input la duong dan chuyen muc
// (VD `/danh-sach/truyen-hot`, `/the-loai/tien-hiep`) hoac URL day du.
// Trang danh sach dung `article.category-story-card` (xem helper.js:
// parseBookList / mtcNextPage). execute(query, page): query la path hoac
// URL, page la token trang sau (URL day du tu `data-next-url`, "" = het).
// Hien tai moi trang mau chi co 1 trang (data-next-url rong).
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
    page = page || "";
    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        url = BASE_URL + query;
    } else if (query) {
        url = BASE_URL + "/" + query;
    } else {
        url = BASE_URL + "/danh-sach/truyen-hot";
    }

    var r = fetchMtcDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    var next = mtcNextPage(doc);
    return Response.success(items, next);
}
