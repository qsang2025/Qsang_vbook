// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Trang muc luc la trang chi tiet (trang 1) hoac /<slug>/index_<N>.html
// (trang N) — app goi toc.js 1 lan cho moi URL ma page.js tra ve.
// Cau truc (kiem chung live 2026-11-15): .book_list.book_list2
// ul.row li a (ten chuong + href /<slug>/<id>/), 100 chuong/trang.
//
// QUIRK trang 1 (ca 绝境黑夜 624 chuong va 万族之劫 1006 chuong):
// 12 chuong MOI NHAT dung dau (giam dan), roi moi den ch.1..100
// tang dan. Ham nay cat bo 12 muc dau do — tim vi tri cua chuong
// co so nho nhat (ch.1) va bo tat ca muc truoc no — de muc luc doc
// theo thu tu tang dan; 12 chuong moi nhat van co mat o dung vi tri
// tren trang cuoi (trung link), chi mat cac muc thong bao
// (完本感言, quang cao sach moi) khong phai chuong truyen.
// Bo trung theo href (phong thu), giu thu tu gap dau tien.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var slug = bookSlug(url);
    if (!slug) return Response.error("Link truyện không hợp lệ.");
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link truyện không hợp lệ.");
    var r = fetchMtDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".book_list.book_list2 ul.row li a");
    if (links.size() === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }

    var raw = [];
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (!link) continue;
        raw.push({ name: name, url: link, num: chapNum(name) });
    }
    if (raw.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }

    // Cat bo khoi "12 chuong moi nhat" dung dau trang 1: tim vi tri
    // dau tien cua so chuong nho nhat; neu tat ca muc truoc no deu
    // co so lon hon thi bo khoi do di.
    var minNum = null;
    var minIdx = -1;
    for (i = 0; i < raw.length; i++) {
        var n = raw[i].num;
        if (n !== null && (minNum === null || n < minNum)) {
            minNum = n;
            minIdx = i;
        }
    }
    var start = 0;
    if (minNum !== null && minIdx > 0) {
        var allNewer = true;
        for (i = 0; i < minIdx; i++) {
            var n2 = raw[i].num;
            if (n2 !== null && n2 <= minNum) { allNewer = false; break; }
        }
        if (allNewer) start = minIdx;
    }

    var chapters = [];
    var seen = {};
    for (i = start; i < raw.length; i++) {
        var link2 = raw[i].url;
        if (seen[link2]) continue;
        seen[link2] = true;
        chapters.push({
            name: raw[i].name,
            url: link2,
            description: "",
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }
    return Response.success(chapters);
}
