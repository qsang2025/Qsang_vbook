// search.js — tim kiem theo tu khoa cua App Truyen Chu.
// Site tim kiem bang /truyen?keyword=<tu khoa> (URL-encode UTF-8), dung
// chung giao dien trang /truyen: 20 truyen/trang, phan trang ?page=N
// (khao sat 2026-11-06, tu khoa "he thong" tra ve truyen mau o vi tri 8).
// Neu query la duong dan (/truyen?... hoac URL day du) thi duyet thang
// trang do nhu mot tab danh sach.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet tab: query la duong dan chuyen muc hoac URL day du.
        url = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else {
        // Tu khoa: /truyen?keyword=
        url = BASE_URL + "/truyen?keyword=" + encodeURIComponent(query);
    }
    url = pagedUrl(url, page);

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var parsed = parseListPage(doc, page);
    return Response.success(parsed.items, parsed.next);
}
