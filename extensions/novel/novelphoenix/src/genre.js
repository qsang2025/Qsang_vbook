// genre.js — Danh sach the loai doc live tu nav trang chu.
//
// The loai 18+/nhay cam bi loc khoi danh sach (tien le FanMTL #68):
// Mature, Ecchi, Adult, Smut, Hentai. Hai slug cat ngan do loi nav cua
// site (Traged, Supernatur — ban day du Tragedy, Supernatural da co)
// cung bi bo. Dao nguoc duoc neu Anh quyet.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

var BLOCKED_GENRES = ["mature", "ecchi", "adult", "smut", "hentai", "traged", "supernatur"];

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var genres = [];
    var seen = {};
    var links = doc.select("a[href^=/genre/]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        if (seen[href]) continue;
        seen[href] = true;
        var slug = href.substring("/genre/".length);
        try { slug = decodeURIComponent(slug); } catch (e) {}
        slug = slug.replace(/\+/g, " ").toLowerCase();
        var blocked = false;
        for (var b = 0; b < BLOCKED_GENRES.length; b++) {
            if (slug === BLOCKED_GENRES[b]) { blocked = true; break; }
        }
        if (blocked) continue;
        genres.push({ title: title, input: href, script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
