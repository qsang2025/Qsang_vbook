// detail.js — Chi tiet 1 truyen Me Doc Truyen (medoctruyen.vn).
//
// Trang chi tiet `/<slug>` (HTML tinh, kiem chung live 2026-11-12):
// - Ten: h1 (du phong ten trong JSON-LD Book).
// - Tac gia / bia / mo ta: JSON-LD Book (script[type="application/ld+json"],
//   chon object co @type "Book" — trang co nhieu script ld+json khac).
//   Bia du phong: img dau tien co src chua "covers/".
// - Trang thai: span co text dung "Dang ra" / "Hoan thanh".
// - The loai: a.genre-chip (loai bo the storyline /browse?storylines=,
//   chi lay link genre=; ten chip co tien to "#" can cat bo).
// - So chuong: tieu de muc luc "(202 chuong)" trong
//   section#danh-sach-chuong h2; cap "202 / 954 chuong" (da dich / tong
//   goc) trong text trang.
// - Cap nhat lan cuoi: "Tac gia cap nhat luc: <thoi gian>".
// execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetchMdDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // JSON-LD Book: ten, tac gia, bia, mo ta.
    var ld = null;
    doc.select("script[type=\"application/ld+json\"]").forEach(function (el) {
        if (ld) return;
        try {
            var parsed = JSON.parse(el.html() || "");
            var arr = parsed;
            if (!(arr instanceof Array)) arr = [parsed];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i]["@type"] === "Book") ld = arr[i];
            }
        } catch (e) {
        }
    });

    var name = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name && ld) name = ld.name || "";
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var author = "";
    var cover = "";
    var description = "";
    if (ld) {
        if (ld.author && ld.author.name) author = ld.author.name;
        cover = ld.image || "";
        description = ld.description || "";
    }
    if (!cover) {
        var coverImg = safeFirst(doc.select("img[src*=\"covers/\"]"));
        if (coverImg !== null) cover = decodeCover(coverImg.attr("srcset") || "") || coverImg.attr("src") || "";
    }

    // Trang thai: span co text dung "Dang ra" / "Hoan thanh".
    var ongoing = true;
    var statusText = "";
    doc.select("span").forEach(function (el) {
        var t = cleanText(el.text());
        if (t === "Đang ra") { statusText = "Đang ra"; ongoing = true; }
        if (t === "Hoàn thành") { statusText = "Hoàn thành"; ongoing = false; }
    });

    // So chuong: "(202 chuong)" o tieu de muc luc; "202 / 954 chuong" o text trang.
    var totalChapters = 0;
    var currentChapters = 0;
    var tocH2 = safeFirst(doc.select("section#danh-sach-chuong h2"));
    if (tocH2 !== null) {
        var m = cleanText(tocH2.text()).match(/\((\d+)\s*chương\)/);
        if (m) totalChapters = parseInt(m[1], 10);
    }
    var bodyText = doc.text() || "";
    var m2 = bodyText.match(/(\d+)\s*\/\s*(\d+)\s*chương/);
    if (m2) {
        // Cap "202 / 954 chuong" = so chuong da co tren site / tong goc.
        // No uu tien hon con so trong tieu de muc luc "(202 chuong)" (chi
        // la so chuong da co), nen ghi de totalChapters bang so thu hai.
        currentChapters = parseInt(m2[1], 10);
        totalChapters = parseInt(m2[2], 10);
    }

    // Cap nhat lan cuoi.
    var updated = "";
    var m3 = bodyText.match(/cập nhật lúc:\s*([\d-]+\s+[\d:]+)/);
    if (m3) updated = m3[1];

    // The loai: a.genre-chip co href genre= (bo storyline).
    var genres = [];
    var genreNames = [];
    var seenG = {};
    doc.select("a.genre-chip[href*=\"genre=\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        var gm = href.match(/genre=([a-z0-9-]+)/);
        var title = cleanText(el.text()).replace(/^#\s*/, "");
        if (gm && title && !seenG[gm[1]]) {
            seenG[gm[1]] = true;
            genreNames.push(title);
            genres.push({ title: title, input: "/browse?genre=" + gm[1], script: "gen.js" });
        }
    });

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (genreNames.length > 0) detailParts.push("Thể loại: " + genreNames.join(", "));
    if (statusText) detailParts.push("Trạng thái: " + statusText);
    if (currentChapters && totalChapters) {
        detailParts.push("Số chương: " + currentChapters + " / " + totalChapters + " chương");
    } else if (totalChapters) {
        detailParts.push("Số chương: " + totalChapters + " chương");
    }
    if (updated) detailParts.push("Cập nhật: " + updated);

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
