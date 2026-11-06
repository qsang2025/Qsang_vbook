// detail.js — thong tin chi tiet mot truyen cua Truyen Full.
// Cau truc trang chi tiet (khao sat 2026-11-06, truyen mau
// Cực Đạo Thiên Ma):
//   ten: h1 dau tien
//   anh bia: img[itemprop="image"] (wp-content/uploads/...jpg)
//   tac gia: .info a[itemprop="author"]
//   the loai: .info a[itemprop="genre"] -> /the-loai/<slug>/
//   trang thai: nhan "Trạng thái:" trong .info — gia tri "Full" nghia la
//     hoan thanh, "Đang cập nhật" nghia la dang ra (khac voi cach hieu
//     "Hoan thanh" cua cac site khac, chu y khong dung indexOf("Hoàn")).
//   mo ta: .desc-text[itemprop="description"]; dong <p> dau tien neu la
//     dong metadata "<b>Thể loại: </b>...<br><b>Editor: </b>..." thi bo.
//   goi y: cac link /truyen/ khac tren trang (truyen lien quan).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Tim gia tri sau mot nhan trong text: "Nhan ... GiaTri" (nhan va gia tri
// cach nhau bang khoang trang/dau hai cham), doc toi nhan ke tiep (neu co).
function labelValue(text, label, nextLabels) {
    var t = String(text || "");
    var idx = t.indexOf(label);
    if (idx === -1) return "";
    var rest = t.substring(idx + label.length).replace(/^[\s:：\-–—]+/, "");
    var cut = rest.length;
    var i = 0;
    for (i = 0; i < nextLabels.length; i++) {
        var j = rest.indexOf(nextLabels[i]);
        if (j !== -1 && j < cut) cut = j;
    }
    return cleanText(rest.substring(0, cut));
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = cleanText(doc.select("h1").first() !== null ? doc.select("h1").first().text() : "");
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var img = doc.select("img[itemprop=\"image\"]").first();
    if (img !== null) cover = absUrl(img.attr("src"));
    if (!cover) {
        var img2 = doc.select(".book-cover img, .cover img").first();
        if (img2 !== null) cover = absUrl(img2.attr("src"));
    }

    var info = doc.select(".info").first();
    var infoText = info === null ? "" : cleanText(info.text());

    var author = "";
    var authorEl = doc.select(".info a[itemprop=\"author\"]").first();
    if (authorEl !== null) author = cleanText(authorEl.text());
    if (!author) author = labelValue(infoText, "Tác giả", ["Thể loại", "Trạng thái", "Theo dõi"]);

    // Trang thai cua site nay: "Full" = hoan thanh, "Đang cập nhật" = dang ra.
    var statusText = labelValue(infoText, "Trạng thái", ["Theo dõi", "Thể loại"]);
    var ongoing = statusText.indexOf("Full") === -1;

    var genres = [];
    var seenGenre = {};
    doc.select(".info a[itemprop=\"genre\"]").forEach(function (el) {
        var href = el.attr("href");
        var title = cleanText(el.text());
        if (!href || !title) return;
        var link = absUrl(href);
        if (seenGenre[link]) return;
        seenGenre[link] = true;
        genres.push({ title: title, input: link, script: "book.js" });
    });

    // Mo ta: .desc-text; bo dong metadata dau tien neu co
    // ("Thể loại: ... Editor: ...").
    var description = "";
    var descEl = doc.select(".desc-text[itemprop=\"description\"]").first();
    if (descEl !== null) {
        var descHtml = String(descEl.html());
        descHtml = descHtml.replace(/^\s*<p[^>]*>\s*<b>\s*Thể loại:\s*<\/b>[\s\S]*?<\/p>/i, "");
        description = descHtml;
    }

    var detailHtml = "";
    if (author) detailHtml += "Tác giả: " + author + "<br>";
    detailHtml += "Trạng thái: " + (ongoing ? "Đang cập nhật" : "Full") + "<br>";
    if (genres.length > 0) {
        var gnames = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) gnames.push(genres[gi].title);
        detailHtml += "Thể loại: " + gnames.join(", ");
    }

    // Goi y: cac truyen khac tren trang (link /truyen/<slug>, tru trang nay).
    // Link tren trang la URL tuyet doi nen chuan hoa truoc khi khop mau.
    var suggests = [];
    var seenSug = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        var link = absUrl(href);
        if (!/\/truyen\/[^\/\?#]+\/?$/.test(link)) return;
        if (link === url || seenSug[link]) return;
        var title = "";
        var im = el.select("img").first();
        if (im !== null) title = cleanText(im.attr("alt"));
        if (!title) title = cleanText(el.text());
        if (!title) return;
        seenSug[link] = true;
        suggests.push({ title: title, input: link, script: "detail.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailHtml,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests.slice(0, 10)
    });
}
