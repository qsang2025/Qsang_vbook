// gen.js — Danh sach truyen theo the loai / danh muc TruyenC
//
// Trang danh sach cua site la SSR, 50 truyen/trang, co link phan trang
// ?page=N that (kiem chung bang curl 2026-11-08: /the-loai/tien-hiep
// 50 muc, co link page=2..5,220). Dung parseNovelCards() + findNextPage()
// dung chung (khop chinh xac so trang, nextToken "" khi het, khong null).
load('config.js');
load('fetch-helpers.js');

function execute(url, page) {
    if (!url) return Response.error("Thiếu đường dẫn danh sách.");
    url = normalizeUrl(url);

    var currentPage = page ? parseInt(page, 10) : 1;
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    if (currentPage !== 1) {
        if (url.indexOf("?") !== -1) {
            url = url + "&page=" + currentPage;
        } else {
            url = url + "?page=" + currentPage;
        }
    }

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không thể kết nối đến TruyenC. Vui lòng kiểm tra lại mạng hoặc bấm Trang nguồn để xác minh.");

    var novelList = parseNovelCards(doc);
    var next = findNextPage(doc, currentPage);
    if (novelList.length === 0) {
        // Trang tai duoc ma khong co muc: tra success rong thay vi
        // error (loi mang/HTTP da bao o tren khi fetchDoc that bai).
        return Response.success([], "");
    }

    return Response.success(novelList, next);
}
