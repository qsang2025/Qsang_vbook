// detail.js — thong tin chi tiet mot truyen cua App Truyen Chu.
// Site khong dung class on dinh cho tung truong (khao sat chi doc duoc
// ten the + thu bac), nen detail dung selector cau truc + regex tren text:
//   ten: h1 dau tien trong <main>
//   anh bia: img dau tien trong <main> (qua proxy /_next/image -> boc ve
//     URL goc tren CDN), xem helper.js unwrapCover(); du phong: JSON-LD
//     Book.image (URL CDN truc tiep) khi img trong <main> loi/trong
//   tac gia: nhan "Tac gia" trong khoi thong tin; du phong: "Tac gia: X"
//     trong mo ta (co truyen de trong o Tac gia nhung mo ta co ghi tac gia)
//   trang thai: "Hoan thanh" / "Dang ra" trong khoi thong tin
//   the loai: chip link /truyen?cate=<slug>
//   mo ta: khoi sau h2 "Gioi thieu", tra TEXT SACH (strip the HTML, giu
//     nguyen noi dung day du; khong lay ban preview line-clamp-4 cua JSON-LD)
//   so chuong / luot doc / theo doi: regex tren text khoi thong tin
//   goi y: cac link truyen khac tren trang ("Truyen khac", "Cung tac gia")
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
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

    var main = safeFirst(doc.select("main"));
    var scope = main !== null ? main : doc;
    var mainText = cleanText(scope.text());

    var name = cleanText(scope.select("h1").first() !== null ? scope.select("h1").first().text() : "");
    if (!name) return Response.error("Không đọc được tên truyện: " + url);
    name = dedupeTitle(name);

    // Anh bia: img dau tien trong main; boc khoi proxy /_next/image.
    var cover = "";
    var img = scope.select("img").first();
    if (img !== null) cover = unwrapCover(img.attr("src"));
    // Du phong (v4): JSON-LD Book.image (URL CDN truc tiep) khi img trong
    // <main> loi/trong. JSON-LD tren site la mang [{@type:"Book", image},
    // {@type:"BreadcrumbList", ...}] (khao sat 2026-11-06). Chi chay khi
    // cover rong — khong doi nguon chinh.
    if (!cover) {
        try {
            var scripts = doc.select("script");
            var si = 0;
            for (si = 0; si < scripts.size() && !cover; si++) {
                var sc = scripts.get(si);
                if (cleanText(sc.attr("type")) !== "application/ld+json") continue;
                var parsedLd = JSON.parse(sc.html());
                var arr = (parsedLd instanceof Array) ? parsedLd : [parsedLd];
                var ai = 0;
                for (ai = 0; ai < arr.length && !cover; ai++) {
                    var im = arr[ai] ? arr[ai].image : null;
                    if (typeof im === "string" && im) { cover = absUrl(im); break; }
                    if (im && typeof im === "object") {
                        if (typeof im.url === "string" && im.url) { cover = absUrl(im.url); break; }
                        if (im instanceof Array && im.length > 0 && typeof im[0] === "string" && im[0]) { cover = absUrl(im[0]); break; }
                    }
                }
            }
        } catch (e) {
            // JSON-LD loi thi giu cover rong, khong lam hong detail.
        }
    }

    // Mo ta: doan HTML sau dong "Gioi thieu" (h2) toi h2 ke tiep.
    // (Runtime vBook chi mo text()/html()/attr()... tren Element, KHONG co
    // .parent() — dung .parent() se nem TypeError va lam ca detail loi.
    // Vi vay cat mo ta truc tiep tu chuoi HTML cua <main>.)
    var description = "";
    var mainHtml = "";
    try { mainHtml = String(scope.html()); } catch (e) { mainHtml = ""; }
    var giIdx = mainHtml.search(/Giới thiệu/);
    if (giIdx !== -1) {
        var closeH2 = mainHtml.indexOf("</h2>", giIdx);
        var start = closeH2 !== -1 ? closeH2 + 5 : giIdx + 10;
        var after = mainHtml.substring(start);
        // Mo ta nam trong mot <section>; cat o </section> dau tien (truoc
        // khoi "Chuong moi nhat" va "Danh sach chuong"). Du phong: h2 ke.
        var closeSec = after.search(/<\/section>/i);
        if (closeSec !== -1) after = after.substring(0, closeSec);
        else {
            var nextH2 = after.search(/<h2[\s>]/i);
            if (nextH2 !== -1) after = after.substring(0, nextH2);
        }
        after = after.replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<button[\s\S]*?<\/button>/gi, "");
        // Mo ta tra TEXT SACH (v4): strip the HTML, giu nguyen noi dung day
        // du (~731 ky tu). Khong lay ban preview line-clamp-4 cua JSON-LD
        // (299 ky tu, cat cut giua cau).
        description = cleanText(htmlDecode(String(after)
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<\/p\s*>/gi, " ")
            .replace(/<[^>]+>/g, " ")));
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
    // Chi lay token so dau tien, GIU hau to K/M va dau cham phan nghin
    // (vd "17.2K", "2.479", "385") — v3 cat ve ^\d+ nen "17.2K" thanh "17".
    // Bo phan thua sau do (diem danh gia "5 (1 danh gia)" va so chuong
    // lap lai sau "Theo doi", khong phai so theo doi).
    var chapters = totalChapters(mainText);
    var views = labelValue(mainText, "Lượt đọc", ["Theo dõi", "Chương", "Thể loại"]);
    var follows = labelValue(mainText, "Theo dõi", ["Chương", "Lượt đọc"]);
    var vm = String(views).match(/^[\d.,]+[KkMm]?/);
    if (vm) views = vm[0];
    var fm = String(follows).match(/^[\d.,]+[KkMm]?/);
    if (fm) follows = fm[0];

    // Diem danh gia cua doc gia (vd: "4,3 ⭐ (12 danh gia)")
    var rating = "";
    var rm = mainText.match(/(\d+[.,]\d+)\s*\(\s*(\d+)\s*đánh giá\s*\)/i);
    if (rm) {
        rating = rm[1] + " ⭐ (" + rm[2] + " đánh giá)";
    }

    if (cover && cover.indexOf("//") === 0) cover = "https:" + cover;
    if (cover && cover.indexOf("http://") === 0) cover = "https://" + cover.substring(7);

    var detailHtml = "";
    if (author) detailHtml += "Tác giả: " + author + "<br>";
    detailHtml += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
    if (rating) detailHtml += "Đánh giá: " + rating + "<br>";
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
