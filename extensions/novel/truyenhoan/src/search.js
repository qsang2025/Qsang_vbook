// search.js — Tim kiem truyen tren Truyen Hoan
// Phan trang tim kiem cua site dung ?tukhoa=...&paged=N (khong dung
// /trang-N/ nhu danh muc); link phan trang that cung dung dang ?paged=N.
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v3, N1):
// fetch qua fetchPageDoc() (fetchDoc + kiem challenge, tra loi tieng Viet
// co huong dan khi gap Cloudflare/login). Tim 0 ket qua la ket qua binh
// thuong, tra success rong (N2), khong bao error.
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(query, page) {
    page = page !== undefined && page !== null ? String(page) : "1";
    if (!query || !String(query).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }

    var q = String(query).trim();
    var url = BASE_URL + "/tim-kiem/?tukhoa=" + encodeURIComponent(q);
    if (page !== "1") {
        url += "&paged=" + page;
    }

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var novels = parseNovelRows(doc);
    // 0 ket qua la ket qua binh thuong (tim tu khoa khong co truyen nao):
    // tra success rong thay vi error (N2).
    if (novels.length === 0) {
        return Response.success([], "");
    }

    var nextPage = findNextPage(doc);
    return Response.success(novels, nextPage);
}
