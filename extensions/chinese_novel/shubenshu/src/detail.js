// detail.js — Chi tiet truyen: ten, tac gia, bia, mo ta, trang thai.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url = url + "/";
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var info = doc.select("#info");
    if (info.isEmpty()) return Response.error("Không tìm thấy truyện");

    var authorEl = selFirst(info, "a[href^=/author/]");
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var statsEl = selFirst(info, "p.hidden-xs");
    var statsText = statsEl ? statsEl.text() : "";
    var categoryEl = selFirst(doc, ".con_top a[href^=/list_]");
    var category = categoryEl ? cleanText(categoryEl.text()) : "";
    var categoryHref = categoryEl ? categoryEl.attr("href") : "";

    var name = cleanText(info.select("h1").text());
    if (!name) return Response.error("Không đọc được tên truyện");
    var detail = ["书名：" + name, "作者：" + (author || "未知")];
    if (category) detail.push("类别：" + category);
    var statPs = info.select("p.hidden-xs");
    for (var i = 0; i < statPs.size(); i++) {
        var t = cleanText(statPs.get(i).text());
        if (t) detail.push(t);
    }

    var tags = [];
    var genres = [];
    if (category && categoryHref) {
        tags.push({ title: category, input: categoryHref, script: "search.js" });
        genres.push({ title: "Cùng thể loại", input: categoryHref, script: "search.js" });
    }
    var suggests = [];
    if (authorEl) {
        suggests.push({ title: "Cùng tác giả", input: authorEl.attr("href"), script: "search.js" });
    }

    var imgEl = selFirst(doc, "#fmimg img");
    var cover = imgEl ? absUrl(imgEl.attr("data-original") || imgEl.attr("src") || "") : "";
    var introEl = selFirst(doc, "#intro");
    var description = introEl ? introEl.html() : "";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail.join("<br>"),
        url: url,
        host: BASE_URL,
        type: "novel",
        format: "novel",
        ongoing: statsText.indexOf("完") === -1,
        tags: tags,
        genres: genres,
        suggests: suggests
    });
}
