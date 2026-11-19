// genre.js — danh sach the loai (execute() -> [{title, input, script}]).
//
// The loai nam trong hop .class tren trang /library.html:
//   .class ul li a[href="/library/<id>.html"]  (玄幻, 仙侠, 都市, 历史...)
// Moi muc tro ve search.js voi input la URL the loai day du.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute() {
    rateLimitDelay("sto66.com", 500, 1500);
    var doc = fetchDoc(BASE_URL + "/library.html");
    if (!doc) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/library.html");

    var genres = [];
    var seen = {};
    var sel = doc.select(".class a[href]");
    var i = 0;
    for (i = 0; i < sel.size(); i++) {
        var el = sel.get(i);
        var href = String(el.attr("href") || "");
        var title = cleanText(el.text());
        if (!href || !title) continue;
        if (href.indexOf("/library/") === -1) continue;
        var url = absUrl(href);
        if (seen[url]) continue;
        seen[url] = true;
        genres.push({ title: title, input: url, script: "search.js" });
    }

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
