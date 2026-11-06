// detail.js — thong tin chi tiet mot truyen cua App Truyen Chu.
// Site khong dung class on dinh cho tung truong (khao sat chi doc duoc
// ten the + thu bac), nen detail dung selector cau truc + regex tren text:
//   ten: h1 dau tien trong <main>
//   anh bia: img dau tien trong <main> (qua proxy /_next/image -> boc ve
//     URL goc tren CDN), xem helper.js unwrapCover()
//   tac gia: nhan "Tac gia" trong khoi thong tin; du phong: "Tac gia: X"
//     trong mo ta (co truyen de trong o Tac gia nhung mo ta co ghi tac gia)
//   trang thai: "Hoan thanh" / "Dang ra" trong khoi thong tin
//   the loai: chip link /truyen?cate=<slug>
//   mo ta: khoi sau h2 "Gioi thieu"
//   so chuong / luot doc / theo doi: regex tren text khoi thong tin
//   goi y: cac link truyen khac tren trang ("Truyen khac", "Cung tac gia")
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

    var main = doc.select("main").first();
    var scope = main !== null ? main : doc;
    var mainText = cleanText(scope.text());

    var name = cleanText(scope.select("h1").first() !== null ? scope.select("h1").first().text() : "");
    if (!name) return Response.error("Không đọc được tên truyện: " + url);
    name = dedupeTitle(name);

    // Anh bia: img dau tien trong main; boc khoi proxy /_next/image.
    var cover = "";
    var img = scope.select("img").first();
    if (img !== null) cover = unwrapCover(img.attr("src"));

    // Mo ta: khoi chua h2 "Gioi thieu" (lay html cua the cha, bo chinh h2).
    var description = "";
    var h2s = scope.select("h2");
    var hi = 0;
    for (hi = 0; hi < h2s.size(); hi++) {
        if (cleanText(h2s.get(hi).text()) === "Giới thiệu") {
            var parent = h2s.get(hi).parent();
            if (parent !== null) {
                description = String(parent.html()).replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, "");
            }
            break;
        }
    }

    // Tac gia: nhan trong khoi thong tin truoc, roi "Tac gia:" trong mo ta.
    var author = labelValue(mainText, "Tác giả", ["Trạng thái", "Thể loại", "Chương", "Lượt đọc", "Theo dõi"]);
    if (!author || author === "—" || author === "-") {
        var m = String(description).match(/Tác giả\s*:\s*([^<\n,;]{2,60})/);
        author = m ? cleanText(m[1]) : "";
    }
    if (author === "—" || author === "-") author = "";

    // Trang thai: doc ngay sau nhan "Trang thai".
    var statusText = labelValue(mainText, "Trạng thái", ["Thể loại", "Chương", "Lượt đọc", "Theo dõi"]);
    var ongoing = statusText.indexOf("Hoàn thành") === -1;

    // The loai: chip link /truyen?cate=.
    var genres = [];
    var seenGenre = {};
    scope.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href || href.indexOf("cate=") === -1) return;
        if (href.indexOf("/truyen?") !== 0) return;
        var title = cleanText(el.text());
        if (!title) return;
        var link = absUrl(href);
        if (seenGenre[link]) return;
        seenGenre[link] = true;
        genres.push({ title: title, input: link, script: "book.js" });
    });

    // So chuong / luot doc / theo doi (phuc vu khoi detail + kiem tra toc).
    var chapters = totalChapters(mainText);
    var views = labelValue(mainText, "Lượt đọc", ["Theo dõi", "Chương", "Thể loại"]);
    var follows = labelValue(mainText, "Theo dõi", ["Chương", "Lượt đọc"]);

    var detailHtml = "";
    if (author) detailHtml += "Tác giả: " + author + "<br>";
    detailHtml += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
    if (chapters > 0) detailHtml += "Chương: " + chapters + "<br>";
    if (views) detailHtml += "Lượt đọc: " + views + "<br>";
    if (follows) detailHtml += "Theo dõi: " + follows + "<br>";
    if (genres.length > 0) {
        var gnames = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) gnames.push(genres[gi].title);
        detailHtml += "Thể loại: " + gnames.join(", ");
    }

    // Goi y: cac truyen khac tren trang (link /truyen/<slug>, tru trang nay).
    var suggests = [];
    var seenSug = {};
    scope.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href || !/^\/truyen\/[^\/\?#]+\/?$/.test(href)) return;
        var link = absUrl(href);
        if (link === url || seenSug[link]) return;
        var title = "";
        var im = el.select("img").first();
        if (im !== null) title = cleanText(im.attr("alt"));
        if (!title) {
            var h3 = el.select("h3").first();
            if (h3 !== null) title = dedupeTitle(cleanText(h3.text()));
        }
        if (!title) return;
        seenSug[link] = true;
        suggests.push({ title: htmlDecode(title), input: link, script: "detail.js" });
    });

    return Response.success({
        name: htmlDecode(name),
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
