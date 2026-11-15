// toc.js — muc luc chuong cua mot truyen (piaotia.com).
//
// Selector that (kiem chung live 2026-11-15 voi 傲世九重天):
// - Muc luc DAY DU tren 1 trang: .centent ul li a (2694 chuong, chuong
//   dau la ch.1, khong lap lai chuong moi nhat — KHONG cat muc dau nhu
//   base cu). Tieu de phan (div.list "第一部 天外之楼"...) khong phai chuong.
// - Link tuong doi dang "762992.html" -> giai theo URL trang muc luc
//   (resolvePtUrl), khong dung absUrl mac dinh.
// - Muc luc khong phan trang nen khong co page.js.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

function execute(url) {
    url = String(url || "");
    if (url.charAt(0) === "/") url = siteOrigin() + url;
    url = normalizeUrl(url);
    var r = fetchPtDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".centent ul li a");
    if (links.size() === 0) {
        links = doc.select(".centent a[href$='.html']");
    }
    if (links.size() === 0) {
        return Response.error("Không tìm thấy mục lục: " + url);
    }

    var data = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var full = resolvePtUrl(url, href);
        if (seen[full]) continue;
        seen[full] = true;
        data.push({
            name: name,
            url: full,
            host: siteOrigin()
        });
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + url);
    }
    return Response.success(data);
}
