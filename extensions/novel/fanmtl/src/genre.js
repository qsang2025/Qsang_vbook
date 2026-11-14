// genre.js — Danh sach the loai doc live tu ul.proplist tren trang danh sach.
//
// The loai 18+/nhay cam bi loc khoi danh sach (tien le valvrareteam #39 /
// banshanren #53): smut, ecchi, lolicon. Dao nguoc duoc neu Anh quyet.
// Cac the loai romance khac (harem, yaoi, yuri, bl, gl) giu nguyen.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

var BLOCKED_GENRES = ["smut", "ecchi", "lolicon"];

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/list/all/all-newstime-0.html");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var genres = [];
    var seen = {};
    var links = doc.select("ul.proplist a[href^=/list/]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        var m = href.match(/^\/list\/([a-z0-9-]+)\/all-newstime-0\.html$/);
        if (!m) continue;
        var slug = m[1];
        if (slug === "all") continue;
        var blocked = false;
        for (var b = 0; b < BLOCKED_GENRES.length; b++) {
            if (slug === BLOCKED_GENRES[b]) { blocked = true; break; }
        }
        if (blocked) continue;
        if (seen[href]) continue;
        seen[href] = true;
        genres.push({ title: title, input: href, script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
