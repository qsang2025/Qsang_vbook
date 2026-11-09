// detail.js — thong tin chi tiet mot truyen cua 爱下电子书 (ixdzs8.com).
// Trang sach /read/<id>/ (khao sat 2026-11-09):
//   .novel .n-img img = bia (img22.ixdzs.com)
//   .n-text h1 = ten truyen
//   .n-text .bauthor = tac gia (link /author/...)
//   .n-text .nsort = the loai (link /sort/<id>/)
//   .n-text .lz = 连载中 / .end = 已完结
//   .n-text .nsize = so chu (vd "52.42万字")
//   .n-text a[href*='/p'] = link chuong moi nhat
//   p#intro.pintro = gioi thieu
//   .tags em a[href^="/tags/"] = tag truyen
//   span.sub-text-r = "共<N>章" (so trang chuong)
//   ul.u-chapter.cfirst = 20 chuong moi nhat (thu tu nguoc)
// Meta OG du phong day du: og:title, og:novel:author, og:novel:status,
// og:novel:latest_chapter_name, og:image, og:description.
// Genres: the loai chinh + cac tag, deu tro ve book.js
// (the loai: /sort/<id>/; tag: /tags/<tag> — deu la trang danh sach
// ul.u-list > li.burl, phan trang ?page=N).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function ogContent(doc, property) {
    var el = doc.select('meta[property="' + property + '"]').first();
    if (el === null) return "";
    return cleanText(el.attr("content"));
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = cleanText(doc.select(".n-text h1").text());
    if (!name) name = ogContent(doc, "og:title");
    if (!name) name = cleanText(doc.select("h1").text());
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = cleanText(doc.select(".n-text .bauthor").text());
    if (!author) author = ogContent(doc, "og:novel:author");

    var coverEl = doc.select(".n-img img").first();
    var cover = coverEl !== null ? coverEl.attr("src") : "";
    if (!cover) cover = ogContent(doc, "og:image");

    var descEl = doc.select("p#intro.pintro").first();
    var description = descEl !== null ? descEl.html() : "";
    if (!description) description = ogContent(doc, "og:description");
    // Bo nut "xem them" (.icon-arrow-d) lan trong gioi thieu.
    description = description.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, "");

    var statusText = cleanText(doc.select(".n-text .lz").text()) ||
        cleanText(doc.select(".n-text .end").text());
    if (!statusText) statusText = ogContent(doc, "og:novel:status");
    var ongoing = statusText.indexOf("完结") === -1 && statusText.indexOf("完本") === -1;

    var size = cleanText(doc.select(".n-text .nsize").text());
    var latestEl = doc.select(".n-text a[href*='/p']").first();
    var latest = latestEl !== null ? cleanText(latestEl.text()) : "";
    if (!latest) latest = ogContent(doc, "og:novel:latest_chapter_name");
    var totalText = cleanText(doc.select("span.sub-text-r").text());
    // Chi lay "共<N>章" — span co the lan them chu khac (vd "更多").
    var totalMatch = totalText.match(/共\d+章/);
    var total = totalMatch ? totalMatch[0] : totalText;

    var detailParts = [];
    if (size) detailParts.push(size);
    if (statusText) detailParts.push(statusText);
    if (total) detailParts.push(total);
    if (latest) detailParts.push("最新: " + latest);

    var genres = [];
    var seenGenre = {};
    var catEl = doc.select(".n-text .nsort").first();
    if (catEl !== null) {
        var catHref = catEl.attr("href");
        var catTitle = cleanText(catEl.text());
        if (catHref && catTitle) {
            genres.push({ title: catTitle, input: absUrl(catHref), script: "book.js" });
            seenGenre[absUrl(catHref)] = true;
        }
    }
    doc.select(".tags em a").forEach(function (el) {
        var href = el.attr("href");
        var title = cleanText(el.text());
        if (!href || !title) return;
        var link = absUrl(href);
        if (seenGenre[link]) return;
        seenGenre[link] = true;
        genres.push({ title: title, input: link, script: "book.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" · "),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        locale: "zh_CN",
        genres: genres
    });
}
