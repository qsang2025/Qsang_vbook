load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Chapter body. The content block also carries an ad slot (inline style,
// script and an injected div); strip them before returning the HTML. The
// chapter title is left to the table of contents, which already names it.
// Chapter text is plain text joined by <br/> (no <p> tags on this site).
function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("truyenc.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var node = safeFirst(doc.select("div.story-content"));
    if (node === null) return Response.error("Không tìm thấy nội dung chương");

    node.select("script, style, iframe, div[id*=ScriptRoot]").remove();
    node.select("input, span.pages, span.current, span.extend").remove();

    var content = node.html();
    // The ad slot leaves its HTML comments behind (they are siblings of the
    // removed div, not inside it); strip them, plus leading empty <p> tags.
    content = content.replace(/<!--[\s\S]*?-->/g, "");
    content = content.replace(/^(<p[^>]*>\s*<\/p>\s*)+/, "");
    content = content.replace(/^\s+/, "");
    if (!cleanText(content)) return Response.error("Chương trống");

    return Response.success(content, "");
}
