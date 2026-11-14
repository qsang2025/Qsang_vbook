// chap.js — Noi dung chuong trong div#chapter-container.
//
// Tieu de chuong: span.chapter-title ("Chapter 1: Apparently I Grew
// Wings"). Noi dung day du, khong khoa, khong quang cao trong khoi
// chuong (kiem chung tu VM 2026-11-15: ch.1 40 doan, ch.2 30 doan).
//
// Hai dong rac duoc loc:
// - Doan dau tien lap lai tieu de chuong (vd. <p>Apparently I Grew
//   Wings</p> trong khi tieu de da la "Chapter 1: Apparently I Grew
//   Wings") — bo khi khop hau to sau "Chapter N: ".
// - Doan ghi chu dich o cuoi chuong: "This translation was made by
//   our team..." — bo.
// Chuong chi co doan ghi chu (vd. ch.604.2) tra loi tieng Viet.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var title = cleanText(doc.select("span.chapter-title").text());
    var body = selFirst(doc, "div#chapter-container");
    if (!body) return Response.error("Không đọc được nội dung chương: " + url);

    var titleSuffix = title.replace(/^Chapter [\d.]+:\s*/, "");
    var paras = body.select("p");
    var html = "";
    var kept = 0;
    for (var i = 0; i < paras.size(); i++) {
        var p = paras.get(i);
        var text = cleanText(p.text());
        if (!text) continue;
        if (text.indexOf("This translation was made by our team") !== -1) continue;
        if (kept === 0 && titleSuffix && text === titleSuffix) continue;
        html += "<p>" + p.html() + "</p>";
        kept++;
    }
    if (kept === 0) return Response.error("Nội dung chương trống: " + url);
    return Response.success(html, title);
}
