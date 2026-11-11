load("config.js");

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchHtml(url);
    if (!doc) return Response.error("Không thể tải thông tin truyện từ " + url);

    var author = "";
    var info = [];
    var metaItems = doc.select(".qk-post-meta__item");
    for (var i = 0; i < metaItems.size(); i++) {
        var e = metaItems.get(i);
        var text = e.text();
        var labelEl = e.select(".qk-post-meta__label");
        if (labelEl && labelEl.text().indexOf("Tác giả") === 0) {
            var valEl = e.select(".qk-post-meta__value");
            if (valEl) author = valEl.text();
        }
        info.push(text);
    }

    var genres = [];
    var catItems = doc.select(".qk-post-meta__cat");
    for (var j = 0; j < catItems.size(); j++) {
        var c = catItems.get(j);
        genres.push({
            title: c.text(),
            input: c.attr("href"),
            script: "gen.js"
        });
    }

    var titleEl = doc.select("h1.qk-post-title").first();
    var name = titleEl ? titleEl.text() : "";
    var coverEl = doc.select(".qk-post-cover__img").first();
    var cover = coverEl ? coverEl.attr("src") : "";
    var descEl = doc.select(".qk-post-content .smiley").first();
    var desc = descEl ? descEl.html() : "";
    var ongoing = doc.select(".qk-post-status.is-completed").size() === 0;

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: desc,
        detail: info.join("<br>"),
        ongoing: ongoing,
        genres: genres,
        host: BASE_URL
    });
}
