load('config.js');
load('rate-limit.js');
load('safe-first.js');

// The chapter list is rendered in full on the story page.
function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("truyenc.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var chapters = [];
    doc.select("a.story-chap-item").forEach(function (el) {
        var href = el.attr("href");
        var name = cleanText(el.select("span.story-chap-name").text()) || cleanText(el.attr("title"));
        if (!href || !name) return;
        // The site doubles the prefix: "Chương 1: Chương 1: Gặp gỡ".
        var dup = name.match(/^Chương (\d+): Chương \1: (.*)$/);
        if (dup) name = "Chương " + dup[1] + ": " + dup[2];
        chapters.push({
            name: name,
            url: absUrl(href),
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) {
        // One-page stories (the joke section) carry no chapter list: their text is on the
        // story page itself, which is what chap.js reads.
        if (doc.select("div.story-content").size() > 0) {
            chapters.push({ name: "Toàn văn", url: url, description: "", lock: false, pay: false });
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương");
    return Response.success(chapters);
}
