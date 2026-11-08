// search.js — Tim kiem truyen tren Truyen Hoan
// Phan trang tim kiem cua site dung ?tukhoa=...&paged=N (khong dung
// /trang-N/ nhu danh muc); link phan trang that cung dung dang ?paged=N.
load('config.js');

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

    var response = safeFetch(url);
    if (!response) return Response.error("Không kết nối được tới " + BASE_URL + ".");
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var novels = parseNovelRows(doc);
    if (novels.length === 0) {
        return Response.error("Không tìm thấy truyện phù hợp.");
    }

    var nextPage = findNextPage(doc);
    return Response.success(novels, nextPage);
}
