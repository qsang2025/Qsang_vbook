// genre.js — Danh sach the loai, doc truc tiep tu menu dieu huong tren
// trang chu (SSR, 91 muc). The loai nguoi lon khong dua vao danh sach
// duyet (xem ghi chu config.js); truyen co the loai do van tim duoc qua
// tim kiem / danh sach / chi tiet.
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

var BLOCKED_GENRES = { "Incest": true };

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var links = doc.select("a[href*='/the-loai/']");
    var genres = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        var m = href.match(/\/the-loai\/([a-z0-9-]+)/);
        if (!m) continue;
        var slug = m[1];
        if (seen[slug]) continue;
        var title = cleanText(a.text());
        if (!title) continue;
        if (BLOCKED_GENRES[title]) continue;
        seen[slug] = true;
        genres.push({ title: title, input: slug, script: "genrecontent.js" });
    }
    if (genres.length === 0) return Response.error("Không tải được danh sách thể loại");
    return Response.success(genres);
}
