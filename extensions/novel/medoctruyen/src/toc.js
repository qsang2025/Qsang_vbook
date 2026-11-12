// toc.js — Danh sach chuong 1 trang muc luc Me Doc Truyen (medoctruyen.vn).
//
// Trang muc luc (URL tu page.js, dang `<slug>?ch=N`): cac chuong nam
// trong section#danh-sach-chuong, luoi div.grid, moi chuong la mot the a
// co href `/<slug>/chuong-<N>`; ten chuong o span dau tien trong the
// (span thu hai la huy hieu "Mien phi" — khong lay). Dedupe theo href
// (link "Moi nhat" o tieu de muc luc trung voi 1 chuong trong luoi).
// Tra ve mang { name, url }. execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");

    var r = fetchMdDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select("section#danh-sach-chuong .grid a[href*=\"/chuong-\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        if (!href || seen[href]) return;
        var nameEl = safeFirst(el.select("span"));
        var name = "";
        if (nameEl !== null) name = cleanText(nameEl.text());
        if (!name) name = cleanText(el.text()).replace(/Miễn phí\s*$/, "");
        if (!name) return;
        seen[href] = true;
        chapters.push({ name: name, url: absUrl(href) });
    });
    if (chapters.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);
    return Response.success(chapters);
}
