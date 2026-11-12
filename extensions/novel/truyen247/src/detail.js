// detail.js — Thong tin chi tiet mot truyen Truyen247.
//
// Trang chi tiet `/<slug>-<id-so>/` (HTML tinh, kiem chung live 2026-11-12):
// - Ten: `h1.title` (itemprop=name).
// - Bia: `meta[property=og:image]` (VD .../images/<slug>-<id>.webp).
// - Tac gia THAT: dong dau mo ta trong div.description ("Tác giả: ...",
//   chu hoa/thuong khong on dinh — "Tác Giả:" hay "Tác giả:" deu co);
//   neu mo ta khong co dong nay thi dung nguoi dang (a[itemprop=author]).
// - Trang thai: dong "Tình Trạng:" trong mo ta la dang tin nhat
//   (p.story_completed cua site co khi lech so voi mo ta — VD tren
//   aztruyen.top: "Ly hôn..." mo ta ghi "Hoàn Thành" nhung
//   p.story_completed ghi "Đang cập nhật"); chi dung p.story_completed
//   lam du phong. Truyen mau tren site nay khong co dong "Tình Trạng:"
//   trong mo ta nen lay trang thai tu p.story_completed ("Hoàn thành").
// - So chuong: so link CHUONG that (URL chua chuong-/part-) trong
//   div#chapters ul.chapters, dedupe theo link (2 ul trung nhau 5 muc
//   moi nhat); 2 muc "Thông báo"/"Giới thiệu truyện mới" khong tinh.
//   Ghi chu "chi hien ... chuong moi nhat" CHI KHI tong so chuong site
//   khai (JSON-LD numberOfPages / "Tổng Chương:" trong mo ta) lon hon
//   so link liet ke — VD tren aztruyen.top: truyen 800 chuong chi hien
//   601–800.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    // App cat dau "/" cuoi cua URL arg khi chay that; site dung URL co "/".
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl = detailUrl + "/";

    var r = fetchT247Doc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var titleEl = doc.select("h1.title").first();
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) {
        var t = doc.title() || "";
        // <title> dang "Truyện <ten> - <nguoi dang>".
        name = cleanText(t.replace(/^Truyện\s+/i, "").split(" - ")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var ogImg = doc.select("meta[property=og:image]").first();
    if (ogImg !== null) cover = ogImg.attr("content") || "";
    if (!cover) {
        var anyImg = doc.select("div.description img, .col-xs-12 img").first();
        if (anyImg !== null) cover = anyImg.attr("data-src") || anyImg.attr("src") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    // Mo ta tho + tac gia that (neu co dong "Tác giả: ..." o dau mo ta).
    // Lay ten tac gia tu HTML tho (truoc the <br> dau tien) vi cleanText
    // da gop khoang trang nen khong tach duoc ten khoi doan sau.
    var description = "";
    var descEl = doc.select("div.description[itemprop=description]").first();
    if (descEl !== null) description = cleanText(descEl.text());

    var author = "";
    if (descEl !== null) {
        var descHtml = descEl.html() || "";
        var am = descHtml.match(/Tác giả:\s*([^<]+)/i);
        if (am) author = cleanText(am[1]);
        if (author && description.indexOf("Tác giả:") === 0) {
            description = cleanText(description.substring(("Tác giả: " + author).length));
        }
    }
    if (!author) {
        var authorEl = doc.select("a[itemprop=author]").first();
        if (authorEl !== null) author = cleanText(authorEl.text());
    }

    var genres = [];
    doc.select("p.story_categories a[itemprop=genre]").forEach(function (el) {
        var gTitle = cleanText(el.text());
        var gHref = el.attr("href") || "";
        if (!gTitle || !gHref) return;
        genres.push({ title: gTitle, input: absUrl(gHref), script: "book.js" });
    });

    var status = "";
    var stm = description.match(/Tình Trạng:\s*([^»]+)/i);
    if (stm) status = cleanText(stm[1]);
    if (!status) {
        var statusEl = doc.select("p.story_completed").first();
        if (statusEl !== null) status = cleanText(statusEl.text());
    }

    // Tong so chuong site khai (JSON-LD numberOfPages, du phong dong
    // "Tổng Chương:" trong mo ta) — dung de biet danh sach chuong co bi
    // cat bot hay khong.
    var totalChapters = 0;
    try {
        var ldEl = doc.select("script[type=\"application/ld+json\"]").first();
        if (ldEl !== null) {
            var ldm = ldEl.html().match(/"numberOfPages"\s*:\s*"(\d+)"/);
            if (ldm) totalChapters = parseInt(ldm[1], 10);
        }
    } catch (e) {
    }
    if (!totalChapters || isNaN(totalChapters)) {
        var tcm = description.match(/Tổng Chương:\s*(\d+)/i);
        if (tcm) totalChapters = parseInt(tcm[1], 10);
        if (isNaN(totalChapters)) totalChapters = 0;
    }

    // So chuong that + chuong dau/cuoi trong danh sach #chapters.
    // Trang co 2 danh sach (5 chuong moi nhat + danh sach day du) nen
    // phai dedupe theo link truoc khi dem; chi dem link chuong that
    // (URL chua chuong-/part-), bo 2 muc "Thông báo"/"Giới thiệu
    // truyện mới" (khong phai chuong).
    var chapCount = 0;
    var chapLinks = 0;
    var chapMin = 0;
    var chapMax = 0;
    var chapSeen = {};
    doc.select("#chapters ul.chapters li.listc a").forEach(function (el) {
        var href = el.attr("href") || "";
        if (!href) return;
        var link = absUrl(href);
        if (chapSeen[link]) return;
        chapSeen[link] = true;
        chapLinks++;
        if (href.indexOf("chuong-") === -1 && href.indexOf("part-") === -1) return;
        var label = cleanText(el.text());
        if (!label) return;
        chapCount++;
        var nm = label.match(/Chương\s+(\d+)/i);
        if (!nm) return;
        var n = parseInt(nm[1], 10);
        if (isNaN(n)) return;
        if (chapMin === 0 || n < chapMin) chapMin = n;
        if (n > chapMax) chapMax = n;
    });

    var ongoing = true;
    if (/Hoàn thành|Full|Hoàn/i.test(status)) {
        ongoing = false;
    }

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (genres.length > 0) {
        var gNames = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) gNames.push(genres[gi].title);
        detailParts.push("Thể loại: " + gNames.join(", "));
    }
    detailParts.push("Trạng thái: " + (ongoing ? "Đang cập nhật" : "Hoàn thành"));
    if (chapCount > 0) {
        if (totalChapters > 0 && totalChapters > chapLinks && chapMin > 0) {
            detailParts.push("Số chương: " + chapCount + " (chỉ hiện " + chapCount + " chương mới nhất: Chương " + chapMin + " – " + chapMax + ")");
        } else {
            detailParts.push("Số chương: " + chapCount);
        }
    }

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
