// book.js — renderer danh sach dung chung cua Truyen Full.
// Y tuong: SPRINGPEACHVINH — home.js / genre.js tro ve book.js lam renderer
// danh sach dung chung. Nhan query la duong dan chuyen muc
// (/danh-sach/... hoac /the-loai/...) hoac URL day du; tu khoa (neu co)
// thi chuyen sang tim kiem /?s=<kw>&post_type=tv6_story.
// Trang danh sach cua site la SSR day du (20 truyen/trang o /danh-sach,
// 30 truyen/trang o /the-loai), phan trang dang /page/N/ (khao sat
// 2026-11-06).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Tai mot trang danh sach va tra ve { items, next, error }.
function listBooks(url, page) {
    var doc = fetchDoc(url);
    if (!doc) return { items: [], next: "", error: "Không tải được trang danh sách: " + url };
    var parsed = parseListPage(doc, page);
    return { items: parsed.items, next: parsed.next, error: "" };
}

// Bien the tra Response truc tiep, dung trong search.js.
function listBooksResponse(url, page) {
    var result = listBooks(url, page);
    if (result.error) return Response.error(result.error);
    return Response.success(result.items, result.next);
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Tab duyet: query la duong dan chuyen muc hoac URL day du.
        url = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else if (query) {
        // Tu khoa (phong khi tab nao do tro thang vao book.js): tim kiem.
        url = BASE_URL + "/?s=" + encodeURIComponent(query) + "&post_type=tv6_story";
    } else {
        url = BASE_URL + "/danh-sach/truyen-moi/";
    }
    return listBooksResponse(listPageUrl(url, page), page);
}
