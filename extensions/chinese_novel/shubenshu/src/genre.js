// genre.js — 10 the loai doc live tu nav.nav trang chu.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var genres = [];
    var links = doc.select("nav.nav a[href^=/list_]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var title = cleanText(a.text());
        var href = a.attr("href");
        if (title && href) {
            genres.push({ title: title, input: href, script: "search.js" });
        }
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
