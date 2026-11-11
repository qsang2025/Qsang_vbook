// detail.js — Thong tin chi tiet mot truyen Metruyenchu.org.
//
// Trang chi tiet `/<slug>` (HTML tinh, kiem chung live 2026-11-11),
// moi thu nam trong khoi `#truyen` (nav/header cung co link the loai
// nen phai gioi han trong #truyen):
// - Ten: `h1.mt-title` (du phong <title> bo tien to "Truyện ").
// - Tac gia: `a.mt-info-tag[href*='/tac-gia/']` ("Đang Cập Nhật" neu chua ro).
// - Bia: og:image (du phong `.mt-book img`, `img[itemprop=image]`).
// - Mo ta: `.mt-desc`.
// - The loai cua truyen: `a.mt-info-tag[href*='/the-loai/']` -> genres
//   tro ve book.js.
// - Trang thai + tong so chuong: cac hang <tr> trong bang thong tin,
//   nhan `td` dau la "Tình trạng:" ("Đang ra" / "Full") va "Số chương:".
//   Meta description cung co dang "…Full/Đang ra mới nhất của <tac gia>…"
//   lam du phong cho trang thai.
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

    var r = fetchMtcDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var root = doc.select("#truyen").first();
    if (root === null) root = doc;

    var name = "";
    var titleEl = root.select("h1.mt-title").first();
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) {
        var t = doc.title() || "";
        name = cleanText(t.replace(/^Truyện\s+/i, ""));
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var ogImg = doc.select("meta[property=og:image]").first();
    if (ogImg !== null) cover = ogImg.attr("content") || "";
    if (!cover) {
        var coverImg = root.select(".mt-book img").first();
        if (coverImg !== null) cover = coverImg.attr("src") || "";
    }
    if (!cover) {
        var itemImg = root.select("img[itemprop=image]").first();
        if (itemImg !== null) cover = itemImg.attr("src") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = "";
    var authorEl = root.select("a.mt-info-tag[href*='/tac-gia/']").first();
    if (authorEl !== null) author = cleanText(authorEl.text());

    var description = "";
    var descEl = root.select(".mt-desc").first();
    if (descEl !== null) description = cleanText(descEl.text());

    var genres = [];
    var seenGenre = {};
    root.select("a.mt-info-tag[href*='/the-loai/']").forEach(function (el) {
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

    var status = "";
    var total = 0;
    root.select("tr").forEach(function (tr) {
        var tds = tr.select("td");
        var ths = tr.select("th");
        if (tds.size() === 0 || ths.size() === 0) return;
        var label = cleanText(tds.get(0).text());
        var value = cleanText(ths.get(0).text());
        if (label.indexOf("Tình trạng") === 0) {
            status = value;
        } else if (label.indexOf("Số chương") === 0) {
            var n = parseInt(value.replace(/[^\d]/g, ""), 10);
            if (!isNaN(n) && n > 0) total = n;
        }
    });

    var ongoing = true;
    if (/Full|Hoàn thành/i.test(status)) {
        ongoing = false;
    } else if (!status) {
        var metaEl = doc.select("meta[name=description]").first();
        if (metaEl !== null) {
            var metaDesc = metaEl.attr("content") || "";
            if (/Full|Hoàn thành/i.test(metaDesc)) ongoing = false;
        }
    }

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
