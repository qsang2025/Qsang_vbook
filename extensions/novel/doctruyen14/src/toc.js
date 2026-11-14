load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Every post is one complete short story read on its own page, so the
// table of contents is a single "Toàn văn" entry pointing at the story url.
function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("doctruyen14.biz");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    if (safeFirst(doc.select("div.entry-content")) === null) {
        return Response.error("Không tìm thấy nội dung truyện");
    }

    return Response.success([{
        name: "Toàn văn",
        url: url,
        description: "",
        lock: false,
        pay: false
    }]);
}
