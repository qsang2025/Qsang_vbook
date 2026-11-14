// chap.js — Noi dung chuong trong #chapter-content.
//
// Tieu de chuong: h1 ("Chapter 1", "Chapter 7313 The Twelfth
// Heavenstage"). Noi dung day du, khong khoa, khong quang cao trong
// khoi chuong (kiem chung tu VM 2026-11-15: ch.1 NSHBA 70 doan,
// ch.7313 36 doan).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var title = cleanText(doc.select("h1").text());
    var body = selFirst(doc, "#chapter-content");
    if (!body) return Response.error("Không đọc được nội dung chương: " + url);
    body.select("script").remove();
    var html = body.html();
    if (!cleanText(html.replace(/<[^>]+>/g, ""))) return Response.error("Nội dung chương trống: " + url);
    return Response.success(html, title);
}
