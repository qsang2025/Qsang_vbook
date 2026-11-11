// toc.js — Muc luc chuong cua mot truyen Metruyenhotvn.
//
// Trang chi tiet chi hien ~55 chuong moi nhat nen muc luc day du lay qua
// API cua chinh site (kiem chung live 2026-11-11):
//   GET /ajax/list-chapter?story=<slug>&chapter=1
// Tra ve JSON {status: 200, html: "<select><option value=\"/slug/chuong-N/\">N</option>..."}.
// Truyen mau Long Thần Thượng Cổ: 272 chuong trong 1 lan goi, khong phan
// trang nen KHONG can page.js. Ten chuong chi co so ("1", "2", ...) nen
// doi ten hien thi thanh "Chương N".
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");
    var slug = storySlug(tocUrl);
    if (!slug) return Response.error("Link mục lục không hợp lệ: " + tocUrl);

    var apiUrl = BASE_URL + "/ajax/list-chapter?story=" + encodeURIComponent(slug) + "&chapter=1";
    var r = fetchMthText(apiUrl);
    if (r.error) return Response.error(r.error);

    var payload = null;
    try {
        payload = JSON.parse(r.text);
    } catch (e) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện).");
    }
    if (!payload || payload.status !== 200 || !payload.html) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện).");
    }

    var chapters = [];
    var seen = {};
    var re = /<option[^>]*value="([^"]+)"[^>]*>(\d+)<\/option>/g;
    var m = null;
    while ((m = re.exec(payload.html)) !== null) {
        var link = absUrl(m[1]);
        var num = m[2];
        if (!link || !num) continue;
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: "Chương " + num,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
