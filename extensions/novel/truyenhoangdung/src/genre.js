// genre.js — Danh sach the loai Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Site co 19 the loai (kiem chung live tu nav trang chu 2026-11-14).
// Doc live tu nav truoc, fallback ve danh sach cung GENRES trong
// file config.js neu fetch hong, dam bao luon du 19.
load("config.js");
load("rate-limit.js");

function execute() {
    var bySlug = {};
    var r = thdFetchDoc(BASE_URL + "/");
    if (r.doc) {
        r.doc.select("a[href*=\"/the-loai/\"]").forEach(function (el) {
            var href = el.attr("href") || "";
            var m = href.match(/\/the-loai\/([a-z-]+)/);
            var name = cleanText(el.text());
            if (m && name && !bySlug[m[1]]) bySlug[m[1]] = name;
        });
    }
    var out = [];
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        var g = GENRES[i];
        var title = bySlug[g.slug] || g.title;
        out.push({ title: title, input: "/the-loai/" + g.slug, script: "gen.js" });
    }
    for (var slug in bySlug) {
        if (bySlug.hasOwnProperty(slug)) {
            var known = false;
            for (var j = 0; j < GENRES.length; j++) {
                if (GENRES[j].slug === slug) known = true;
            }
            if (!known) {
                out.push({ title: bySlug[slug], input: "/the-loai/" + slug, script: "gen.js" });
            }
        }
    }
    if (out.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(out);
}
