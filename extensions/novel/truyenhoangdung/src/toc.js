// toc.js — Danh sach chuong Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Muc luc DU 1 lan tren trang chi tiet: #chuong .list-chap a, moi nhat
// len truoc (Co Chan Nhan: 3.813 link, ch.1–3819) — khong can page.js.
// Ten chuong kem span "(3 năm trước)" — cat bo text cua span. Dao
// nguoc de chuong 1 len truoc, dedupe theo href.
// execute(url) — url la URL trang chi tiet.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");
    var r = thdFetchDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var rows = doc.select("#chuong .list-chap a[href*=\"/chuong-\"]");
    var chapters = [];
    var seen = {};
    for (var i = rows.size() - 1; i >= 0; i--) {
        var el = rows.get(i);
        var href = el.attr("href") || "";
        if (!href || seen[href]) continue;
        var name = cleanText(el.text());
        var spanEl = selFirst(el, "span");
        if (spanEl) {
            var spanText = cleanText(spanEl.text());
            if (spanText && name.length > spanText.length && name.substring(name.length - spanText.length) === spanText) {
                name = cleanText(name.substring(0, name.length - spanText.length));
            }
        }
        if (!name) continue;
        seen[href] = true;
        chapters.push({ name: name, url: normalizeUrl(href) });
    }
    if (chapters.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);
    return Response.success(chapters);
}
