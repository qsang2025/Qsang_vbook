// chap.js — noi dung mot chuong truyen tranh: mang URL anh theo thu tu
// (template comic). Y tuong: template comic cua Darkrai9x.
// page.js (neu khai bao) chi phan trang MUC LUC, khong phan trang anh.
// SELECTOR_PAGE_IMAGES: doi thanh selector anh trang truyen that cua site.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được chương truyện tranh: " + url);

    var images = [];
    var seen = {};
    // Nhieu site comic lazy-load — uu tien data-src truoc src.
    doc.select("SELECTOR_PAGE_IMAGES img").forEach(function (el) {
        var src = el.attr("data-src") || el.attr("src");
        if (!src) return;
        // Anh CDN co the la URL tuong doi hoac bat dau bang "//".
        if (src.indexOf("//") === 0) src = "https:" + src;
        else if (src.indexOf("http") !== 0) src = absUrl(src);
        if (seen[src]) return;
        seen[src] = true;
        images.push(src);
    });

    if (images.length === 0) return Response.error("Không đọc được ảnh chương (site có thể đã đổi giao diện): " + url);
    return Response.success(images);
}
