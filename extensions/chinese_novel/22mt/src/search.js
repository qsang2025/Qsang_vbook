// search.js — Tim kiem truyen (execute(query, page) -> items, next).
//
// Form tim kiem cua site: GET /search.php?q=<tu khoa>&p=<trang>
// (kiem chung live 2026-11-15: "绝境黑夜" tra 1 ket qua that,
// tieu de "共1条记录"). Ket qua cung cau truc the dl nhu gen.js.
// Phan trang qua ?p=N (link ">" trong div.pages).
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
    var kw = String(query || "").replace(/^\s+|\s+$/g, "");
    if (!kw) return Response.error("Nhập từ khóa để tìm kiếm.");
    var searchUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        searchUrl = absUrl(String(page));
    } else {
        searchUrl = BASE_URL + "/search.php?q=" + encodeURIComponent(kw);
    }
    if (!searchUrl) return Response.error("Đường dẫn tìm kiếm không hợp lệ.");
    var r = fetchMtDoc(searchUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseListRows(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + kw + "\"");
    }

    var next = nextPageToken(doc, searchUrl);
    return Response.success(items, next);
}
