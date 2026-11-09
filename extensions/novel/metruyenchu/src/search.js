// search.js — Tim kiem truyen tren Me Truyen Chu
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v4, N1):
// fetch qua fetchPageDoc() (fetchDocWithFallback + kiem challenge, tra
// loi tieng Viet co huong dan khi gap Cloudflare/login); parse danh sach
// dung chung parseStoryItems() trong helper.js (N2). Tim 0 ket qua la
// ket qua binh thuong, tra success rong (N3), khong bao error.
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }

    var url = BASE_URL + "/search?q=" + encodeURIComponent(String(key).trim());
    if (page && String(page) !== '1') {
        url = url + "&page=" + page;
    }

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var novelList = parseStoryItems(doc);

    // 0 ket qua la ket qua binh thuong (tim tu khoa khong co truyen nao):
    // tra success rong thay vi error (N3).
    if (novelList.length === 0) {
        return Response.success([], "");
    }

    var currentPage = page ? parseInt(page, 10) : 1;
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    // nextToken LUON la string: "" khi het trang, khong bao gio null.
    var next = findNextPage(doc, currentPage);

    return Response.success(novelList, next);
}
