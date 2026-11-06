// search.js — tim kiem theo tu khoa (template novel).
// Y tuong: Darkrai9x — search.js vua la tim kiem tu khoa, vua la script
// danh sach cho tab home/genre (query bat dau bang "/" hoac "http" thi coi
// la duong dan chuyen muc, khong phai tu khoa). Ban template nay giu ca
// hai nhanh, nhung tab home/genre mac dinh tro ve search.js (renderer dung
// chung); search.js chi dung cho o tim kiem tu khoa.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

// SELECTOR_RESULT_ITEMS: doi thanh selector dong ket qua that cua site.
var SEARCH_ROW_SELECTOR = "SELECTOR_RESULT_ITEMS";

function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet tab: query la duong dan chuyen muc hoac URL day du.
        var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
        url = base;
    } else {
        // Tu khoa: /tim-kiem?q= (doi endpoint theo site that).
        url = BASE_URL + "/tim-kiem?q=" + encodeURIComponent(query);
    }
    url = pagedUrl(url, page);

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var items = storyItems(doc, SEARCH_ROW_SELECTOR);
    var next = nextPageToken(doc);
    return Response.success(items, next);
}
