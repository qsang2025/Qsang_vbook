// toc.js — muc luc cua 和图书 (hetushu.com).
// URL nhan vao la URL trang chi tiet
// (https://www.hetushu.com/book/<id>/index.html); muc luc nam NGAY tren
// trang chi tiet (dl#dir), chi 1 trang duy nhat ke ca sach 1.235 chuong
// (剑来, khao sat 2026-11-10), nen KHONG can page.js.
// Link chuong: /book/<id>/<so>.html (vd /book/10195/7144725.html).
// Cac <dt> la tieu de quyen (第一卷 笼中雀...) — khong dua vao danh sach,
// chi lay link trong <dd>. Khong co chuong khoa VIP (khong thay
// VIP/付费/订阅/锁定 tren detail/toc/chap da kiem tra).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");

    rateLimitDelay("www.hetushu.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var items = [];
    var seen = {};
    doc.select("dl#dir dd a").forEach(function (a) {
        var href = a.attr("href");
        if (!href) return;
        // Chi nhan link chuong dang /book/<id>/<so>.html.
        if (!/^\/book\/\d+\/\d+\.html$/.test(href)) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        var name = cleanText(a.text());
        if (!name) return;
        items.push({
            name: htmlDecode(name),
            url: link,
            description: "",
            lock: false,
            pay: false,
            host: siteOrigin()
        });
    });

    if (items.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + url);
    }

    return Response.success(items);
}
