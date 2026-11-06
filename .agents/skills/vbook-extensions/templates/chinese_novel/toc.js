// toc.js — muc luc chuong cua mot truyen (template novel).
// Y tuong: Darkrai9x toc.js. Tra ve mang chuong { name, url, description,
// lock, pay }. Neu site phan trang muc luc thi khai bao them page.js
// (app goi toc.js tren tung URL ma page.js tra ve).
// SELECTOR_CHAPTER_LINKS: doi thanh selector danh sach chuong that cua site.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('gbk.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocGbk(url);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var chapters = [];
    var seen = {};
    doc.select("SELECTOR_CHAPTER_LINKS a").forEach(function (el) {
        var href = el.attr("href");
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

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
