// gen.js — danh sach truyen theo chuyen muc (execute(url, page) -> items, nextPage).
//
// Cac dang URL danh sach tren storya.click (20 truyen/trang, phan trang
// ?page=N 1-based, link a[rel="next"]):
//   /vi/stories                (tab home: Moi cap nhat)
//   /vi/stories?sort=reads     (tab home: Doc nhieu)
//   /vi/stories?sort=rating    (tab home: Danh gia cao)
//   /vi/stories?sort=title     (tab home: A-Z)
//   /vi/genres/<slug>          (the loai tu genre.js / detail.js)
// Moi dong truyen: link a[href="/vi/stories/<slug>"] co h2/h3 hoac
// img alt lam ten, img lam bia, p lam mo ta (xem parseStories trong
// file helper.js).
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// Ghe so trang 1-based cua app vao URL danh sach (?page=N).
function buildUrl(input, page) {
    var u = toSiteUrl(input || "/vi/stories");
    var p = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(p, 10);
    if (isNaN(pn) || pn < 1) pn = 1;
    u = u.split("#")[0].replace(/([?&])page=\d+/g, "");
    if (u.indexOf("?") !== -1) return u + "&page=" + pn;
    return u + "?page=" + pn;
}

function execute(url, page) {
    var target = buildUrl(url, page);
    var r = fetchStoryaDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var data = parseStories(doc);
    if (data.length === 0) return Response.error("Không có dữ liệu tại " + target);
    return Response.success(data, getNextPage(doc));
}
