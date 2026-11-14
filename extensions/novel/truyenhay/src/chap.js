// chap.js — Noi dung ky truyen Truyen Hay (truyenhay.com).
//
// Doc HTML trang bai viet, lay div.entry-content[itemprop=text], bo
// script/style/iframe/quang cao, bo dong "Tac gia : ..." o dau bai,
// tra lai chu Latin that (fixText) roi tra HTML + ten ky.
// execute(url).
//
// Load: file config.js, file rate-limit.js, file safe-first.js.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("truyenhay.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
    var doc = response.html();

    var content = safeFirst(doc.select("article div.entry-content[itemprop=text]"));
    if (!content) return Response.error("Không tìm thấy nội dung chương");
    content.select("script, style, noscript, iframe, ins, .related, .sharedaddy").remove();

    // Bo dong tac gia o dau bai (vd "Tac gia : Luong Thi Be").
    var first = content.select("p").first();
    if (first && /^Tác giả\s*:/.test(fixText(first.text()))) first.remove();

    var html = fixText(content.html());
    var title = fixText(doc.select("article h1.entry-title").text());
    if (!html || !/<p/i.test(html)) return Response.error("Nội dung chương trống");
    return Response.success(html, title);
}
