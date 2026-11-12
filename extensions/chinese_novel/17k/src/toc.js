// toc.js — muc luc truyen 17k.
// Input la URL chi tiet /book/<id>.html; doi sang /list/<id>.html
// (toan bo chuong trong 1 trang — da kiem chung truyen 1252 chuong van
// chi co 1 trang, khong phan trang nen khong can page.js). Site chia
// muc luc thanh nhieu khoi dl.Volume (正文 + cac 卷) — lay het.
// Moi chuong: a[target] trong dl.Volume; ten o span.ellipsis;
// chuong VIP co span.ellipsis.vip — danh dau pay=true + tien to "[VIP] "
// (mau zongheng). description lay tu thuoc tinh title (字数 + ngay cap nhat).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url).replace("h5.17k.com", "www.17k.com");
    var tocUrl = BASE_URL + url.replace("/book/", "/list/");
    var response = fetchPage(tocUrl);
    if (!response || !response.ok) return Response.error("Không tải được mục lục (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();
    var data = [];
    var seen = {};
    var els = doc.select("dl.Volume a[target]");
    for (var i = 0; i < els.size(); i++) {
        var e = els.get(i);
        var href = e.attr("href");
        if (!href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var spanEl = safeFirst(e.select("span.ellipsis"));
        var chapterName = spanEl ? cleanText(spanEl.text()) : cleanText(e.text());
        if (!chapterName) continue;
        var vip = false;
        if (spanEl) {
            var cls = spanEl.attr("class") || "";
            if (cls.indexOf("vip") !== -1) vip = true;
        }
        var desc = e.attr("title") || "";
        data.push({
            name: (vip ? "[VIP] " : "") + chapterName,
            url: link,
            description: cleanText(desc),
            lock: false,
            pay: vip,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không thấy chương nào trong mục lục");
    return Response.success(data);
}
