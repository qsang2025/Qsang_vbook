// toc.js — Muc luc chuong cua mot truyen Metruyenchu.org.
//
// Trang chi tiet co khoi `#mt-chapters-list` chua TOAN BO chuong theo
// thu tu tang dan (kiem chung live 2026-11-11: 41 chuong, thieu 40, 42
// — do site xoa that, fetch truc tiep cung 404; 237 chuong o truyen
// Dẫn Chu Loan). Khong phan trang nen KHONG can page.js.
// Luu y: dau trang chi tiet con co khoi "chuong moi nhat" (thu tu giam
// dan) — chi lay khoi #mt-chapters-list de khong trung chuong.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");

    var r = fetchMtcDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select("#mt-chapters-list li.chap-item a").forEach(function (el) {
        var href = el.attr("href") || "";
        var name = cleanText(el.text());
        if (!href || !name) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) {
        doc.select(".chap-item a").forEach(function (el) {
            var href = el.attr("href") || "";
            var name = cleanText(el.text());
            if (!href || !name) return;
            var link = absUrl(href);
            if (seen[link]) return;
            seen[link] = true;
            chapters.push({
                name: name,
                url: link,
                description: "",
                lock: false,
                pay: false
            });
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
