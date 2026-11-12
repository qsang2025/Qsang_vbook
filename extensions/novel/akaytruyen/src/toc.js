// toc.js — Danh sach chuong 1 trang muc luc AkayTruyen (akaytruyen.com).
//
// Trang muc luc (URL tu page.js, dang `<slug>?old_first=1&page=N`,
// 50 chuong/trang, cu nhat truoc): cac chuong nam trong
// .story-detail__list-chapter--list, moi chuong co 2 the (mobile +
// desktop) cung href — dedupe theo href. SO CHUONG CHUAN lay tu thuoc tinh
// data-chapter cua the chuong (URL co 3 dang: /chuong-<N>-...,
// /<N>-chuong-<N>-... va /<N>-<ten>...; co ca chuong dac biet khong co so
// trong URL — chi data-chapter moi dung, vd chuong 16 cua Con Duong Ba Chu
// co URL .../nhan-cach-dang-tran-trong). Ten chuong ghep tu so chuong +
// .chapter-title (cat bo tien to "Chương <N>:" neu the tieu de tu mang,
// vd Thien La). Sap xep tang dan theo so chuong. Tra ve mang { name, url,
// description, lock, pay }. execute(url).
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

    var r = fetchAkDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select(".story-detail__list-chapter--list .chapter-card-desktop, .story-detail__list-chapter--list .chapter-card-mobile").forEach(function (card) {
        var linkEl = safeFirst(card.select("a[href]"));
        if (linkEl === null) return;
        var href = linkEl.attr("href") || "";
        if (!href) return;
        var link = absUrl(href);
        var key = link.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;

        var num = parseInt(card.attr("data-chapter") || "0", 10);
        if (!num || isNaN(num)) num = chapterNumberFromUrl(link);
        var titleEl = safeFirst(card.select(".chapter-title"));
        var title = titleEl !== null ? cleanText(titleEl.text()) : "";
        // The tieu de doi khi tu mang tien to "Chương <N>:" (vd Thien La).
        title = title.replace(/^Chương\s*\d+\s*[:：]?\s*/i, "");
        if (!title) {
            var raw = cleanText(card.text());
            title = raw.replace(/^Chương\s*\d+\s*/i, "");
        }
        var name = chapterDisplayName(num, title);
        chapters.push({ name: name, url: link, description: "", lock: false, pay: false, _num: num });
    });

    if (chapters.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);

    chapters.sort(function (a, b) {
        if (a._num > 0 && b._num > 0 && a._num !== b._num) return a._num - b._num;
        if (a._num > 0 && b._num <= 0) return -1;
        if (a._num <= 0 && b._num > 0) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    var i = 0;
    for (i = 0; i < chapters.length; i++) delete chapters[i]._num;
    return Response.success(chapters);
}
