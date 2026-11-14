load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("doctruyen14.biz");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    // A genre page has story cards but no story body; a story page has
    // div.entry-content. Tell them apart so a mistyped link fails clearly.
    if (safeFirst(doc.select("div.entry-content")) === null) {
        return Response.error("Không tìm thấy truyện (đây có thể là trang thể loại)");
    }

    var name = cleanText(doc.select("h1.entry-title").text());
    if (!name) return Response.error("Không tìm thấy truyện");

    var author = cleanText(doc.select("a.story-chip--author").text());
    var meta = safeFirst(doc.select("meta[name=description]"));
    var description = meta === null ? "" : cleanText(meta.attr("content"));

    var genres = [];
    doc.select("a.story-chip--cat").forEach(function (el) {
        var title = cleanText(el.text());
        if (!title) return;
        genres.push({ title: title, input: absUrl(el.attr("href")), script: "list.js" });
    });

    var detail = [];
    if (author) detail.push("Tác giả: " + author);
    if (genres.length > 0) detail.push("Thể loại: " + genres[0].title);
    detail.push("Truyện ngắn một kỳ, đọc trọn trong một trang");

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: detail.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: false,
        genres: genres
    });
}
