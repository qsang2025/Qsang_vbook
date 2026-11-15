// page.js — Phan trang muc luc (execute(url) -> [URL trang muc luc]).
//
// Muc luc nam tren trang chi tiet /novelbooks/<id>/, chia theo .folder
// (moi folder co pid; ul co thuoc tinh p = trang hien tai; phan tu .pc
// trong folder cho tong so trang — theo item.js cua site). Khi cuon het
// trang, site nap them qua AJAX /episode/<itemid>/<pid>/<p+1>.html
// (tra ve doan HTML <li> — khong phai JSON).
// Kiem chung live 2026-11-16: sach mau 100806 (120 chuong) va sach
// discovery 454097 (417 chuong) deu co muc luc DAY DU tren trang 1
// (chi 1 folder, khong co .pc, /episode/.../2.html tra 404) — page.js
// tra ve [detailUrl] cho cac sach nay. Sach nao co .pc > p thi tra
// them cac URL /episode/ tuong ung de app goi toc.js tung trang.
// Tra it nhat 1 trang (theo hop dong extension-api.md: moi trang
// phai cho ra chuong).
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
    url = normalize8bUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    // Trang chi tiet khong co "/" cuoi se 301 ve dang co "/" (kiem chung
    // live 2026-11-16) — them "/" de tranh loi HTTP 301.
    if (/\/novelbooks\/\d+$/.test(url)) url += "/";
    var m = url.match(/\/novelbooks\/(\d+)\//);
    if (!m) return Response.error("Không nhận ra id truyện trong URL: " + url);
    var itemid = m[1];

    var r = fetch8bDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pages = [url];
    var seen = {};
    seen[url] = true;
    var folders = doc.select("#chapters .folder[pid]");
    for (var i = 0; i < folders.size(); i++) {
        var f = folders.get(i);
        var pid = f.attr("pid") || "";
        if (!pid) continue;
        var ul = safeFirst(f.select("ul"));
        var p = 1;
        if (ul !== null) {
            var pv = parseInt(ul.attr("p") || "1", 10);
            if (!isNaN(pv) && pv > 0) p = pv;
        }
        var total = p;
        var pc = safeFirst(f.select(".pc"));
        if (pc !== null) {
            var tv = parseInt(cleanText(pc.text()) || "", 10);
            if (!isNaN(tv) && tv > total) total = tv;
        }
        for (var n = p + 1; n <= total; n++) {
            var ep = "https://www.8book.com/episode/" + itemid + "/" + pid + "/" + n + ".html";
            if (!seen[ep]) {
                seen[ep] = true;
                pages.push(ep);
            }
        }
    }
    return Response.success(pages);
}
