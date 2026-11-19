// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, host}]).
//
// Nhan URL trang muc luc (/chapter/<bookId>.html hoac /chapter/<bookId>/<N>.html,
// do page.js tra ve) hoac URL trang truyen (/book/<bookId>.html — tu suy ra
// trang muc luc 1). Danh sach chuong nam trong #allchapter dd a, href dang
// /chapter/<bookId>/<chapId>.html; link phan trang /chapter/<bookId>/<so>.html
// nam ngoai #allchapter nen khong bi lan.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function tocUrlOf(url) {
    var u = normalizeUrl(url);
    if (u.indexOf("/chapter/") !== -1) return u;
    var m = u.match(/\/book\/([A-Za-z0-9]+)\.html/);
    if (m) return siteOrigin() + "/chapter/" + m[1] + ".html";
    return u;
}

function execute(url) {
    var target = tocUrlOf(url);
    rateLimitDelay("sto66.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được mục lục: " + target);

    var chapters = [];
    var seen = {};
    var sel = doc.select("#allchapter a[href]");
    var i = 0;
    for (i = 0; i < sel.size(); i++) {
        var a = sel.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        if (href.indexOf("/chapter/") === -1) continue;
        if (/\/\d+\.html$/.test(href)) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            host: siteOrigin(),
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + target);
    }
    return Response.success(chapters);
}
