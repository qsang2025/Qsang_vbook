// genre.js — Danh sach the loai Metruyenchu.org (metruyenchu.org).
//
// Doc cac link the loai tu trang chu (34 the loai, kiem chung live
// 2026-11-11). Site viet ten the loai khong nhat quan giua cac cho
// ("Tiên Hiệp" / "Tiên hiệp" / "dammy" vs "Đam Mỹ") nen gom theo slug va
// chon text dep nhat (nhieu tu nhat, roi nhieu chu hoa nhat), sau do
// chuan hoa viet hoa dau tu. Moi muc tro ve book.js (renderer danh sach
// dung chung).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    var r = fetchMtcDoc(BASE_URL + "/");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var bySlug = {};
    var order = [];
    doc.select("a[href*='/the-loai/']").forEach(function (el) {
        var href = el.attr("href") || "";
        var m = href.match(/\/the-loai\/([a-z0-9\-]+)/);
        if (!m) return;
        var slug = m[1];
        var text = cleanText(el.text());
        if (!text || text.length < 2) return;
        if (!bySlug[slug]) {
            bySlug[slug] = [];
            order.push(slug);
        }
        bySlug[slug].push(text);
    });

    var genres = [];
    var i = 0;
    for (i = 0; i < order.length; i++) {
        var slug = order[i];
        var title = bestGenreText(bySlug[slug]);
        if (!title) title = titleCaseVi(slug.replace(/-/g, " "));
        var url = BASE_URL + "/the-loai/" + slug;
        genres.push({ title: title, input: url, script: "book.js" });
    }

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
