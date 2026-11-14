// toc.js — Danh sach chuong 1 trang muc luc Me Doc Truyen Chu.
// Trang muc luc (URL tu page.js, dang `<slug>?page=N`): cac chuong nam
// trong .story-detail__list-chapter--list__item, moi chuong la mot the a
// co href `/<slug>/chuong-<N>`; ten chuong la text cua the a (vd.
// "Chương 1", co chuong kem hau to ten). Dedupe theo href. Tra ve mang
// { name, url }. execute(url).
load("config.js");
load("rate-limit.js");

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");
    var r = mdcFetchDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select(".story-detail__list-chapter--list__item a[href*=\"/chuong-\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        if (!href || seen[href]) return;
        var name = cleanText(el.text());
        if (!name) return;
        seen[href] = true;
        chapters.push({ name: name, url: normalizeUrl(href) });
    });
    if (chapters.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);
    return Response.success(chapters);
}
