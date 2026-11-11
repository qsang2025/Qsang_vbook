// detail.js — Thong tin chi tiet 1 truyen.
load("config.js");
load("rate-limit.js");

function execute(url) {
    rateLimitDelay("quykhu.com");
    var doc = fetchHtml(normalizeUrl(url));
    if (!doc) return Response.error("Không tải được trang truyện");
    var author = "";
    var info = [];
    doc.select(".qk-post-meta__item").forEach(function (e) {
        var text = e.text().trim();
        if (e.select(".qk-post-meta__label").text().indexOf("Tác giả") === 0) {
            author = e.select(".qk-post-meta__value").text().trim();
        }
        if (text) info.push(text);
    });
    var genres = [];
    doc.select(".qk-post-meta__cat").forEach(function (e) {
        genres.push({ title: e.text().trim(), input: e.attr("href"), script: "gen.js" });
    });
    return Response.success({
        name: doc.select("h1.qk-post-title").text().trim(),
        cover: doc.select(".qk-post-cover__img").attr("src"),
        author: author,
        description: doc.select(".qk-post-content .smiley").html(),
        detail: info.join("<br>"),
        ongoing: doc.select(".qk-post-status.is-completed").size() === 0,
        genres: genres,
        host: BASE_URL
    });
}
