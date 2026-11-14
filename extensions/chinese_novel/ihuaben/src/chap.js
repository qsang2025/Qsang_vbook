// chap.js — Noi dung chuong trong #contentsource.
// Moi doan <p class="dp"> kem <i class="num"> (so binh luan) va xen ke
// cac khoi <div class="passage-cosplay-preview"> chua 段评 — go bo ca
// hai truoc khi tra ve, chi giu lai van ban truyen.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var chapterUrl = normalizeUrl(url);
    if (!chapterUrl) return Response.error("URL chương không hợp lệ");
    var rr = ttlFetchDoc(chapterUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var contentEl = selFirst(doc, "#contentsource");
    if (!contentEl) return Response.error("Không đọc được nội dung chương: " + chapterUrl);

    try {
        contentEl.select("i.num").remove();
    } catch (e) {
    }
    try {
        contentEl.select(".passage-cosplay-preview").remove();
    } catch (e2) {
    }

    var html = "";
    try {
        html = contentEl.html();
    } catch (e3) {
    }
    if (!html || cleanText(contentEl.text()).length < 10) {
        return Response.error("Chương này chưa mở khóa hoặc cần đăng nhập — extension không mở khóa chương trả phí.");
    }

    var title = "";
    var titleEl = selFirst(doc, "h1");
    if (titleEl) title = cleanText(titleEl.text());
    return Response.success(html, title);
}
