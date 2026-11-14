// chap.js — Noi dung mot chuong: HTML trong
// #chapter-content .published-content, tieu de trong h1.chapter-title.
// Chuong VIP co .content-lock thi bao loi tieng Viet ro rang, khong mo khoa.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("URL chương không hợp lệ");
    var rr = blhFetchDoc(chapUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var root = selFirst(doc, "#chapter-content");
    if (!root) return Response.error("Không tìm thấy nội dung chương");
    if (root.select(".content-lock").size() > 0) {
        return Response.error("Bạn cần mua chương VIP này trên blhvip.vn để đọc.");
    }

    var content = selFirst(root, ".published-content");
    if (!content) return Response.error("Không tìm thấy nội dung chương");
    content.select("script, style, iframe, ins").remove();

    var titleEl = selFirst(root, "h1.chapter-title");
    var title = titleEl ? cleanText(titleEl.text()) : "";
    return Response.success(content.html(), title);
}
