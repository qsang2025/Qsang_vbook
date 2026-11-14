// chap.js — Noi dung mot chuong: HTML trong div.reading-content.
// Chuong khoa (is-locked, khong co noi dung) thi bao loi tieng Viet ro
// rang, khong mo khoa.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("URL chương không hợp lệ");
    // Referer la trang chi tiet (cat doan chuong o cuoi URL).
    var lastSlash = chapUrl.lastIndexOf("/");
    var referer = lastSlash > 0 ? chapUrl.substring(0, lastSlash) : (BASE_URL + "/");
    var rr = ttlFetchDoc(chapUrl, referer);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var titleEl = selFirst(doc, "h1.chapter-reading-title");
    var title = titleEl ? cleanText(titleEl.text()) : "";

    var contentEl = selFirst(doc, ".reading-content");
    var html = "";
    if (contentEl) html = contentEl.html() || "";
    if (!html || cleanText(contentEl.text()).length < 20) {
        var locked = doc.select(".is-locked").size() > 0;
        if (locked || doc.text().indexOf("mở khóa") !== -1) {
            return Response.error("Chương này đang bị khóa, cần mở khóa trên web để đọc: " + chapUrl);
        }
        return Response.error("Không đọc được nội dung chương (trang rỗng): " + chapUrl);
    }
    return Response.success(html, title);
}
