// toc.js — Muc luc (execute(url) -> chapters).
//
// Trang chi tiet /novelbooks/<id>/ co day du muc luc trong #chapters a
// (kiem chung live 2026-11-16: sach mau 120 chuong, discovery 417 chuong,
// deu day du tren trang 1). Sach nao phan trang muc luc thi app goi
// page.js lay danh sach URL /episode/... roi goi toc.js tren tung URL;
// toc.js xu ly ca 2 dang URL: trang chi tiet (parse #chapters a) va
// doan HTML /episode/ (parse a.episode_li — doan <li> tra ve, khong
// phai JSON, theo item.js cua site).
// CHU Y: link chuong tro ve host //sport.thepaperbooks.com (domain
// spam/SEO, 0 ky tu) nhung episode id trong query la that —
// normalize8bUrl viet lai host ve www.8book.com, GIU NGUYEN query
// ?<episode> (chap.js doc duoc tren host that — probe tren may that
// 2026-11-16: ch.2 3.610 ky tu).
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
    var r = fetch8bDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    // Dang 1: URL /episode/<id>/<pid>/<n>.html — doan HTML <li> (khong
    // phai trang day du, khong co #chapters); parse thang link chuong.
    // Dang 2: trang chi tiet — parse #chapters a.
    var sel = /\/episode\/\d+\/\d+\/\d+\.html$/.test(url)
        ? "a.episode_li" : "#chapters a";
    var links = doc.select(sel);
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        var link = absUrl(normalize8bUrl(href));
        if (!link || seen[link]) continue;
        var nm = cleanText(a.text());
        if (!nm) continue;
        seen[link] = true;
        items.push({ name: nm, url: link, description: "", lock: false, pay: false });
    }
    if (items.length === 0) {
        return Response.error("Không đọc được mục lục.");
    }
    return Response.success(items);
}
