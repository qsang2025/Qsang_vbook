// toc.js — muc luc: toan bo chuong nam ngay tren trang chi tiet
// (`.catalog_box .chapter_list`), khong phan trang — kiem chung live
// 2026-11-14: truyen 404 chuong (招惹) tra du 404 muc trong 1 lan goi.
// Truyen nhieu tap cung chung mot kieu: chuong la link duy nhat duoi
// .chapter_list, tieu de tap la div chu khong phai link.
//
// Load: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("banshanren.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
    var doc = response.html();

    var chapters = [];
    var seen = {};
    var links = doc.select(".catalog_box .chapter_list li a");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href || seen[href]) continue;
        seen[href] = true;
        chapters.push({
            name: cleanText(el.attr("title") || el.text()),
            url: absUrl(href),
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy mục lục");
    return Response.success(chapters);
}
