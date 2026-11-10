// page.js — PHAN TRANG MUC LUC cho SS Truyen (sstruyen.net).
//
// Muc luc cua 1 truyen chia nhieu trang, 20 chuong/trang:
// trang 1 la URL chi tiet goc, cac trang sau la `<url>/page/N`
// (VD `/truyen/cuu-trong-tu/page/2` co chuong 21–40).
// Tong so chuong doc tu trang chi tiet (meta description
// "…tổng số 295 chương…" hoac so chuong lon nhat tren trang);
// so trang = ceil(tong / 20). Tra ve mang URL cac trang muc luc
// theo thu tu; app se goi toc.js tren tung URL do.
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

    var r = fetchSsDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var total = totalChaptersFromDetail(doc);
    var pages = tocPageUrls(detailUrl, total);
    return Response.success(pages);
}
