// page.js — Cac trang muc luc: muc luc phan trang 50 chuong/trang
// qua Server Action (page=N, limit=100 gui di nhung action chi tra
// 50 chuong/trang — kiem chung tren may that 2026-11-13). Doc tong so
// chuong + bookId tu trang chi tiet roi tra URL tung trang dang
// /<slug>?tocpage=N&bookId=<id>&total=<tong> (toc.js doc tham so tu URL
// nen khong can tai lai trang chi tiet).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url).split("#")[0];
    var r = fetchTtvPage(url);
    if (r.error) return Response.error(r.error);

    var bookId = extractBookId(r.rawHtml);
    if (!bookId) return Response.error("Không đọc được mã truyện (bookId) trên trang chi tiết.");

    var total = extractTotalChapters(r.doc);
    if (total <= 0) return Response.error("Không đọc được tổng số chương trên trang chi tiết.");

    var slug = url.replace(BASE_URL, "").replace(/^\//, "").split("?")[0].split("#")[0];
    var pages = Math.ceil(total / 50);
    var data = [];
    for (var p = 1; p <= pages; p++) {
        data.push(BASE_URL + "/" + slug + "?tocpage=" + p + "&bookId=" + bookId + "&total=" + total);
    }
    return Response.success(data);
}
