// toc.js — Muc luc chuong cua mot truyen Wetruyen (wetruyen.com).
//
// Trang chi tiet co 2 khoi chuong: khoi "Các chương mới nhất"
// (`.l-chapters`, 5 chuong cuoi) va khoi `#list-chapter` "Danh sách
// chương" (50 chuong cua trang hien tai). Chi lay khoi `#list-chapter`
// de khong trung chuong giua cac trang. Ten chuong lay nguyen text link
// (VD "Chương 1"), bo ky tu BOM site chen truoc chu "Chương".
// Trang muc luc duoc page.js liet ke truoc
// (`/<slug>.<id>/trang-N/`).
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

    var r = fetchWtDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    doc.select("#list-chapter a[href*='/chuong-']").forEach(function (el) {
        var href = el.attr("href") || "";
        var name = stripBom(cleanText(el.text()));
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

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
