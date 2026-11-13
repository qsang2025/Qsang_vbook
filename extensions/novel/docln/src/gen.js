// gen.js — danh sach truyen theo chuyen muc (execute(url, page) -> items, nextPage).
//
// Cac dang trang danh sach tren docln.sbs (42 truyen/trang, phan trang
// ?page=N 1-based):
//   /danh-sach?truyendich=1&sapxep=...   (tab home)
//   /danh-sach?sangtac=1&sapxep=...      (tab home)
//   /the-loai/<slug>                     (the loai tu genre.js)
// Moi dong truyen: div.thumb-item-flow > .content.img-in-ratio (bia,
// data-bg hoac style) + .thumb_attr.series-title a (ten + link) +
// .thumb_attr.chapter-title a (chuong moi nhat) + .thumb_attr.volume-title.
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

// Giai URL danh sach that cho so trang 1-based cua app.
function buildUrl(input, page) {
    var u = String(input || "");
    var p = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(p, 10);
    if (isNaN(pn) || pn < 1) pn = 1;
    u = u.replace("{{page}}", String(pn));
    if (/[?&]page=\d+/.test(u)) return u.replace(/([?&]page=)\d+/, "$1" + pn);
    if (u.indexOf("?") !== -1) return u + "&page=" + pn;
    return u + "?page=" + pn;
}

function execute(url, page) {
    var target = buildUrl(url, page);
    var r = fetchDoclnDoc(target);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var data = parseListItems(doc);
    if (data.length === 0) return Response.error("Không có dữ liệu tại " + target);

    var next = "";
    var mp = maxPage(doc);
    var pn = parseInt(String(page || "1").replace(/\s/g, ""), 10);
    if (isNaN(pn) || pn < 1) pn = 1;
    if (mp > 0 && pn < mp) next = String(pn + 1);
    return Response.success(data, next);
}
