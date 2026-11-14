// chap.js — Noi dung chuong trong #chapter-article .chapter-content.
//
// Dau khoi noi dung co 1 div quang cao (div[align=center] + script) can
// cat bo. Tieu de chuong: header.chapter-header h2 ("Chapter 1").
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var title = cleanText(doc.select("#chapter-article .chapter-header h2").text());
    var body = selFirst(doc, "#chapter-article .chapter-content");
    if (!body) return Response.error("Không đọc được nội dung chương: " + url);
    body.select("div[align=center], script").remove();
    var html = body.html();
    if (!cleanText(html.replace(/<[^>]+>/g, ""))) return Response.error("Nội dung chương trống: " + url);
    return Response.success(html, title);
}
