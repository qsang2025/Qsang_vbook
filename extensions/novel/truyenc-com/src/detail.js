load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("truyenc.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var name = cleanText(doc.select("div.page-title h1").text());
    if (!name) return Response.error("Không tìm thấy truyện");

    var img = safeFirst(doc.select("img.story-image"));
    var author = cleanText(doc.select("h3 b").text());
    var status = cleanText(doc.select("p.h6").text());

    var description = cleanText(doc.select("div.d-none.d-sm-block").text());
    if (!description) description = cleanText(doc.select("div.d-block.d-sm-none").text());

    var detail = [];
    if (status) detail.push(status);
    var latest = cleanText(doc.select("p.mt-2.mb-2").text());
    if (latest) detail.push(latest);
    // The publish date and view count sit in one `p` as two `span.pr-2` values.
    var stats = doc.select("span.pr-2");
    if (stats.size() >= 2) {
        detail.push("Đăng " + cleanText(stats.get(0).text()) + " · " + cleanText(stats.get(1).text()) + " lượt xem");
    }

    // Category badges; 18+/audio categories are out of scope and skipped.
    var genres = [];
    doc.select("h6.color-highlight a.badge").forEach(function (el) {
        var title = cleanText(el.text());
        if (!title) return;
        var input = absUrl(el.attr("href"));
        if (isExcludedSection(input)) return;
        genres.push({ title: title, input: input, script: "list.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: img === null ? "" : img.attr("src"),
        description: description,
        detail: detail.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: status.indexOf("Hoàn") === -1,
        genres: genres
    });
}
