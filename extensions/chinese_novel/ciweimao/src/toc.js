// toc.js — Muc luc (execute(url) -> [{name, url, lock}]).
//
// Muc luc nam ngay tren trang chi tiet /book/<id>: .cnt-box.catalogue
// li a — DU 1 trang (sach mau 749 muc, kiem chung live 2026-11-16).
// Chuong khoa co <i class="icon icon-lock"> trong link — danh dau
// lock: true va tien to "[VIP] " (chuong khoa tra trang dang nhap khi
// mo — chap.js bao loi tieng Viet ro rang, khong bypass).
// Khong co phan trang muc luc nen khong can page.js.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeStoryUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");
    var r = fetchCwDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".cnt-box.catalogue li a");
    if (links.size() === 0) links = doc.select(".catalogue li a");
    if (links.size() === 0) {
        return Response.error("Không đọc được mục lục: " + url);
    }
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        var link = normalizeStoryUrl(href);
        if (!link || seen[link]) continue;
        var nm = cleanBookName(a.text());
        if (!nm) continue;
        var locked = a.select("i.icon-lock").size() > 0;
        if (locked) nm = "[VIP] " + nm;
        seen[link] = true;
        items.push({ name: nm, url: link, lock: locked, pay: locked, host: siteOrigin() });
    }
    if (items.length === 0) {
        return Response.error("Không đọc được mục lục: " + url);
    }
    return Response.success(items);
}
