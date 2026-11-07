// detail.js — Thong tin chi tiet truyen tren TruyenC
load('config.js');
load('fetch-helpers.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetchDoc(url);
    if (!doc) {
        var altUrl = url.replace("https://truyenc.net", "https://www.truyenc.net");
        doc = fetchDoc(altUrl);
    }
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = doc.select("h1").first() ? doc.select("h1").first().text().trim() : "";
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var imgEl = doc.select("img[src*='cloudfront.net'], img[src*='cover']").first();
    if (!imgEl) imgEl = doc.select("img").first();
    if (imgEl) {
        cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var author = "";
    var authorEl = doc.select("a[href*='/tac-gia/']").first();
    if (authorEl) {
        author = authorEl.text().trim();
    } else {
        var text = doc.text();
        var aMatch = text.match(/Tác giả\s*:\s*([^\n\r]+)/);
        if (aMatch) author = aMatch[1].trim();
    }

    var description = "";
    var descEl = doc.select(".tóm-tắt, .summary, .prose, .desc, [class*='description']").first();
    if (descEl) description = descEl.html();
    else {
        var pList = doc.select("p");
        for (var i = 0; i < pList.size(); i++) {
            var pt = pList.get(i).text();
            if (pt && pt.length > 50) {
                description += "<p>" + pt + "</p>";
            }
        }
    }

    var fullText = doc.text();
    var ongoing = true;
    if (fullText.indexOf("Hoàn thành") !== -1 || fullText.indexOf("Full") !== -1 || fullText.indexOf("ĐÃ HOÀN") !== -1) {
        ongoing = false;
    }

    var chapterCount = 0;
    var chMatch = fullText.match(/(\d+)\s*(?:Chương|chương)/i);
    if (chMatch) {
        chapterCount = parseInt(chMatch[1], 10);
    }

    var detailLines = [];
    if (author) detailLines.push("<b>Tác giả:</b> " + author);
    detailLines.push("<b>Trạng thái:</b> " + (ongoing ? "Đang ra" : "Hoàn thành"));
    if (chapterCount > 0) detailLines.push("<b>Số chương:</b> " + chapterCount);

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detailLines.join("<br>"),
        host: BASE_URL,
        ongoing: ongoing
    });
}
