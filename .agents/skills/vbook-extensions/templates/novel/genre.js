// genre.js — danh sach the loai (template novel).
// Y tuong: Darkrai9x (doc trang the loai, moi muc tro ve script danh sach)
// + ustaezav (bo the loai audio neu site co muc audio khong doc duoc bang
// trinh doc truyen chu). Moi muc co input la duong dan the loai; app se
// goi book.js voi input do (xem book.js).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute() {
    var doc = fetchDoc(BASE_URL + "/the-loai");
    if (!doc) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/the-loai");

    var genres = [];
    var seen = {};
    // SELECTOR_GENRE_LIST: doi thanh selector danh sach the loai that cua site.
    doc.select("SELECTOR_GENRE_LIST a").forEach(function (el) {
        var href = el.attr("href");
        var title = cleanText(el.text());
        if (!href || !title) return;
        var url = absUrl(href);
        if (seen[url]) return;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
