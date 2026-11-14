load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Full story body. The content block carries only the story paragraphs
// plus a comment-plugin clearing div and an input; strip those before
// returning the HTML. The story title is returned as the chapter title.
function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("doctruyen14.biz");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var node = safeFirst(doc.select("div.entry-content"));
    if (node === null) return Response.error("Không tìm thấy nội dung chương");

    node.select("script, style, iframe, input, svg, div.wpdiscuz_top_clearing").remove();

    var content = node.html();
    content = content.replace(/<!--[\s\S]*?-->/g, "");
    content = content.replace(/^(<p[^>]*>\s*<\/p>\s*)+/, "");
    content = content.replace(/^\s+/, "");
    if (!cleanText(content)) return Response.error("Chương trống");

    var title = cleanText(doc.select("h1.entry-title").text());
    return Response.success(content, title);
}
