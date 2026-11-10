// detail.js — Thong tin chi tiet mot truyen Wetruyen (wetruyen.com).
//
// Trang chi tiet `/<slug>.<id>/` (HTML tinh, kiem chung live 2026-11-11):
// - Ten: `h1.title`.
// - Tac gia: `.info a[itemprop=author]`.
// - Bia: `.books img[itemprop=image]` (du phong og:image).
// - Mo ta: `.desc-text[itemprop=description]`.
// - The loai cua truyen: `.info a[itemprop=genre]` -> genres tro ve book.js.
// - Trang thai + tong so chuong: meta description
//   ("Truyện Kiếm Lai của tác giả Phong Hỏa Hí Chư Hầu số chương 1323
//   tình trạng Đang ra."); du phong trang thai tu `.info span.text-primary`,
//   tong so chuong tu so chuong lon nhat trong khoi "chuong moi nhat".
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetchWtDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select("h1.title").text());
    if (!name) {
        var t = doc.title() || "";
        name = cleanText(t.split(" - ")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var imgEl = doc.select(".books img[itemprop=image]").first();
    if (imgEl !== null) cover = imgEl.attr("src") || "";
    if (!cover) {
        var ogImg = doc.select("meta[property=og:image]").first();
        if (ogImg !== null) cover = ogImg.attr("content") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = "";
    var authorEl = doc.select(".info a[itemprop=author]").first();
    if (authorEl !== null) author = cleanText(authorEl.text());

    var description = "";
    var descEl = doc.select(".desc-text[itemprop=description]").first();
    if (descEl !== null) description = cleanText(descEl.text());

    var genres = [];
    var seenGenre = {};
    doc.select(".info a[itemprop=genre]").forEach(function (el) {
        var gTitle = cleanText(el.text());
        var gHref = el.attr("href") || "";
        if (gTitle && gHref) {
            var gUrl = absUrl(gHref);
            if (!seenGenre[gUrl]) {
                seenGenre[gUrl] = true;
                genres.push({ title: gTitle, input: gUrl, script: "book.js" });
            }
        }
    });

    var metaDesc = "";
    var metaEl = doc.select("meta[name=description]").first();
    if (metaEl !== null) metaDesc = metaEl.attr("content") || "";
    var ongoing = true;
    if (/Hoàn thành/i.test(metaDesc)) {
        ongoing = false;
    } else {
        var statusEl = doc.select(".info span.text-primary").first();
        if (statusEl !== null) {
            var st = cleanText(statusEl.text());
            if (/Hoàn thành/i.test(st)) ongoing = false;
        }
    }
    var total = totalChaptersFromDetail(doc);

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (genres.length > 0) {
        var gNames = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) gNames.push(genres[gi].title);
        detailParts.push("Thể loại: " + gNames.join(", "));
    }
    detailParts.push("Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành"));
    if (total > 0) detailParts.push("Số chương: " + total);

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" • "),
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
