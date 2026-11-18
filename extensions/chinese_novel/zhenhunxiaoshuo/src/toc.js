// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, host}]).
//
// Muc luc nam inline ngay tren trang truyen:
//   section.container .excerpts article.excerpt a[href="/<n>.html"]
//     ten dang "第1章 ..." hoac "镇魂番外篇 四 （八）"
// Muc dau tien thuong la "简介" (trang gioi thieu, khong phai chuong) -> bo.
// Muc luc KHONG phan trang (镇魂 117 muc, 魔道祖师 128 muc, deu 1 trang)
// nen khong can page.js. Chap nhan ca URL trang truyen lan URL chuong.
// Trang chu "/" duoc doi ve /lunhuigui/ (muc luc that cua 镇魂).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function resolveTocUrl(url) {
    var u = normalizeUrl(url);
    var m = u.match(/^(https?:\/\/[^\/]+)(\/.*)$/);
    if (m && (m[2] === "/" || m[2] === "")) return siteOrigin() + "/lunhuigui/";
    // URL chuong (/123.html) -> khong biet slug truyen, giu nguyen de
    // detail.js phia tren xu ly; o day chi can path truyen: neu la URL chuong
    // thi khong co cach suy ra trang truyen, bao loi ro rang.
    if (/\/\d+\.html$/.test(u)) return "";
    return u;
}

function execute(url) {
    var target = resolveTocUrl(url);
    if (!target) {
        return Response.error("Mục lục cần URL trang truyện (vd. /modaozushi/), không phải URL chương: " + url);
    }
    rateLimitDelay("zhenhunxiaoshuo.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được mục lục: " + target);

    var chapters = [];
    var seen = {};
    var sel = doc.select(".excerpts article.excerpt a[href]");
    var i = 0;
    for (i = 0; i < sel.size(); i++) {
        var a = sel.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        if (!/\.html$/.test(href)) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        if (name.indexOf("简介") !== -1) continue;
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
