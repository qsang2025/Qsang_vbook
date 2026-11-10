// page.js — PHAN TRANG MUC LUC cho Wetruyen (wetruyen.com).
//
// Muc luc cua 1 truyen chia nhieu trang, 50 chuong/trang:
// trang 1 la URL chi tiet goc, cac trang sau la `<url>/trang-N/`
// (VD `/can-nuot-troi-cao.24174/trang-2/` co chuong 51–100).
// Tong so chuong doc tu trang chi tiet (meta description
// "…số chương 311 tình trạng Đang ra."); so trang = ceil(tong / 50).
// Tra ve mang URL cac trang muc luc theo thu tu; app se goi toc.js
// tren tung URL do.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    detailUrl = detailUrl.replace(/\/+$/, "");

    var r = fetchWtDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var total = totalChaptersFromDetail(doc);
    var pages = tocPageUrls(detailUrl, total);
    return Response.success(pages);
}
