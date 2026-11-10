// detail.js — Thong tin chi tiet mot truyen SS Truyen (sstruyen.net).
//
// Trang chi tiet `/truyen/<slug>` (HTML tinh, kiem chung live 2026-11-10):
// - Ten: `h1.story-title` (du phong JSON-LD `name`).
// - Tac gia: `a[href*='/tac-gia/'] span[itemprop=name]`.
// - Bia: `meta[property=og:image]`.
// - Mo ta: `.short-content` (bo tien to "GIỚI THIỆU"); du phong JSON-LD `description`.
// - The loai cua truyen: `a[itemprop=genre]` -> genres tro ve book.js.
// - Trang thai + tong so chuong: meta description ("…Hoàn thành - Full với
//   tổng số 295 chương…"); "Hoàn thành"/"Full" = het, "Đang ra" = dang ra.
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

    var r = fetchSsDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select("h1.story-title").text());
    var jsonLd = null;
    var ldEl = doc.select("script[type='application/ld+json']").first();
    if (ldEl !== null) {
        try { jsonLd = JSON.parse(ldEl.html()); } catch (e) { jsonLd = null; }
    }
    if (!name && jsonLd && jsonLd.name) name = cleanText(jsonLd.name);
    if (!name) {
        var t = doc.title() || "";
        name = cleanText(t.split(" - ")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var ogImg = doc.select("meta[property=og:image]").first();
    if (ogImg !== null) cover = ogImg.attr("content") || "";
    if (!cover && jsonLd && jsonLd.image) cover = jsonLd.image;
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = "";
    var authorEl = doc.select("a[href*='/tac-gia/'] span[itemprop=name]").first();
    if (authorEl !== null) author = cleanText(authorEl.text());
    if (!author && jsonLd && jsonLd.author) {
        if (jsonLd.author instanceof Array && jsonLd.author.length > 0) {
            author = cleanText(jsonLd.author[0].name || "");
        } else if (jsonLd.author.name) {
            author = cleanText(jsonLd.author.name);
        }
    }

    var description = "";
    var shortEl = doc.select(".short-content").first();
    if (shortEl !== null) {
        description = cleanText(shortEl.text()).replace(/^GIỚI THIỆU\s*/i, "");
    }
    if (!description && jsonLd && jsonLd.description) {
        description = cleanText(jsonLd.description);
    }

    var genres = [];
    var seenGenre = {};
    doc.select("a[itemprop=genre]").forEach(function (el) {
        var gTitle = cleanText(el.text());
        var gHref = el.attr("href") || "";
        var gSlug = gHref.replace(/^https?:\/\/[^\/]+\//, "").replace(/\/+$/, "");
        if (gTitle && gSlug && !seenGenre[gSlug]) {
            seenGenre[gSlug] = true;
            genres.push({ title: gTitle, input: "/" + gSlug, script: "book.js" });
        }
    });

    var metaDesc = "";
    var metaEl = doc.select("meta[name=description]").first();
    if (metaEl !== null) metaDesc = metaEl.attr("content") || "";
    var ongoing = true;
    if (/Hoàn thành|Full/i.test(metaDesc)) ongoing = false;
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
