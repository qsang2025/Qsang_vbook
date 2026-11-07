// detail.js — Thong tin chi tiet truyen Me Truyen Chu
load('config.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var name = "";
    var titleEl = doc.select("h1[itemprop='name']").first();
    if (!titleEl) titleEl = doc.select("h1").first();
    if (titleEl) name = titleEl.text().trim();
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var coverEl = doc.select(".book-info-pic img").first();
    if (!coverEl) coverEl = doc.select("img[src*='/media/']").first();
    if (!coverEl) coverEl = doc.select("img").first();
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
    }

    var author = "";
    var authorEl = doc.select("a[href*='/tac-gia/']").first();
    if (authorEl) {
        author = authorEl.text().trim();
    }

    var description = "";
    var descEl = doc.select("[itemprop='description']").first();
    if (!descEl) descEl = doc.select(".intro").first();
    if (!descEl) descEl = doc.select(".desc-text").first();
    if (!descEl) descEl = doc.select(".description").first();
    if (descEl) {
        description = descEl.html();
    }

    var ongoing = true;
    var pageText = doc.text();
    var statusMatch = pageText.match(/Trạng thái\s*:\s*([^\n\r]+)/);
    var statusText = "";
    if (statusMatch) {
        statusText = statusMatch[1].trim();
        var stLower = statusText.toLowerCase();
        if (stLower.indexOf("hoàn thành") !== -1 || stLower.indexOf("full") !== -1 || stLower.indexOf("hoàn") !== -1) {
            ongoing = false;
        }
    }

    var genres = [];
    var seen = {};
    doc.select("a[href*='/the-loai/']").forEach(function (e) {
        var title = e.text().trim();
        var href = e.attr("href");
        if (title && href && !seen[title]) {
            seen[title] = true;
            genres.push({
                title: title,
                input: href,
                script: "gen.js"
            });
        }
    });

    var detailLines = [];
    if (author) detailLines.push("<b>Tác giả:</b> " + author);
    if (statusText) detailLines.push("<b>Trạng thái:</b> " + statusText);
    var chapterMatch = pageText.match(/Số chương\s*:\s*(\d+)/);
    if (chapterMatch) detailLines.push("<b>Số chương:</b> " + chapterMatch[1]);
    if (genres.length > 0) {
        var gNames = [];
        for (var i = 0; i < genres.length; i++) gNames.push(genres[i].title);
        detailLines.push("<b>Thể loại:</b> " + gNames.join(", "));
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detailLines.join("<br>"),
        host: BASE_URL,
        genres: genres,
        ongoing: ongoing
    });
}
