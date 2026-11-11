// book.js — Renderer danh sach truyen dung chung cho AzTruyen.
//
// Dung cho cac tab home.js / genre.js: input la duong dan chuyen muc
// (VD `/the-loai/fanfiction`) hoac URL day du, hoac input trang chu co
// them hau to muc `/#top` / `/#moi` (trang chu co 2 muc trong 2
// div.row.storylist: 0 = "Top Truyện Hay", 1 = "Truyện mới cập nhật").
// Trang the loai phan trang `?page=N` (nut "›" trong
// div.pagination-control ul.page); trang chu khong phan trang.
// execute(query, page): query la path hoac URL, page la token trang sau
// (URL day du tu azNextPage, "" = het).
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
    var sectionIndex = -1;
    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        // Tach hau to muc trang chu (VD "/#top", "/#moi") khoi path.
        var hashAt = query.indexOf("#");
        var path = query;
        if (hashAt !== -1) {
            var section = query.substring(hashAt + 1);
            path = query.substring(0, hashAt) || "/";
            if (section === "top") sectionIndex = 0;
            else if (section === "moi") sectionIndex = 1;
        }
        url = BASE_URL + path;
    } else if (query) {
        url = BASE_URL + "/" + query;
    } else {
        url = BASE_URL + "/";
    }

    var r = fetchAzDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookList(doc, sectionIndex);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    // Trang chu khong phan trang; chi tim trang sau o trang the loai.
    var next = sectionIndex === -1 ? azNextPage(doc) : "";
    return Response.success(items, next);
}
