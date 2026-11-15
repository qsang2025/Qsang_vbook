// gen.js — Danh sach truyen 1 the loai (execute(url, page) -> items, next).
//
// URL that (kiem chung live 2026-11-15): input "/xuanhuan.html",
// trang N la "/xuanhuan-<N>.html" (trang 1 = /xuanhuan-1.html).
// Moi trang 30 muc #fengtui .bookbox, phan trang toi 330 trang.
// Pager co nut ">" tro toi trang ke (href "-<N+1>.html"); het trang
// thi khong co nut do -> next = "".
// Trang danh sach KHONG co anh bia — cover lay o detail (og:image),
// KHONG fetch tung trang chi tiet chi de lay bia nhu base cu
// (base cu fetch N+1 request cho 1 trang danh sach).
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

function execute(url, page) {
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;
    var base = String(url || "").replace(/\.html$/i, "");
    if (!base) return Response.error("Thiếu đường dẫn thể loại.");
    var listUrl = normalizeUrl(BASE_URL + base + "-" + pn + ".html");
    var r = fetchBqDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookBoxes(doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này (site có thể đã đổi giao diện): " + listUrl);

    // Con trang ke khi pager co nut ">" tro toi -<pn+1>.html.
    var next = "";
    var pagerLinks = doc.select("a[href*=\"-" + (pn + 1) + ".html\"]");
    var j = 0;
    for (j = 0; j < pagerLinks.size(); j++) {
        if (cleanText(pagerLinks.get(j).text()) === ">") {
            next = String(pn + 1);
            break;
        }
    }
    return Response.success(items, next);
}
