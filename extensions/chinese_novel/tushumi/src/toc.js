// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Muc luc DAY DU tren 1 trang chi tiet, khong phan trang (kiem chung
// live 2026-11-15: 大奉打更人 980 dd tho, 968 chuong duy nhat;
// 末世被算计 284 dd tho, 190 chuong duy nhat).
// Cau truc that cua #list: dt "结局" (muc phu) + dt "正文" + cac dd.
// Site liet ke N chuong moi nhat truoc (moi -> cu, goi la ban xem
// truoc), roi toan bo danh sach tu chuong 1 tro di (tang dan), roi
// cac muc phu o cuoi — vi du 大奉: [6 muc phu] + [ch.121..116] +
// [ch.1..ch.121 cac tap] + [6 muc phu]; 末世: [ch.190..97] +
// [ch.1..ch.190]. Vi vay KHONG duoc lay theo thu tu gap dau tien:
// giu lai ban xuat hien CUOI cua moi link thi duoc thu tu doc dung
// (ch.1 -> ... -> chuong cuoi, muc phu o cuoi). href dang tuyet doi
// "/shu/<id>/<chapterid>.html", giai theo goc site.
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
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/shu/" + id + "/";
    var r = fetchTmDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("#list dt:contains(正文) ~ dd a[href]");
    if (links.size() === 0) links = doc.select("#list dd a[href]");
    if (links.size() === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + detailUrl);
    }

    // Thu thap theo thu tu gap, ghi lai vi tri xuat hien cuoi cua moi link.
    var raw = [];
    var lastIdx = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (!link) continue;
        raw.push({ name: name, url: link });
        lastIdx[link] = raw.length - 1;
    }

    // Chi giu ban xuat hien cuoi cua moi link -> thu tu doc dung
    // (chuong 1 dau tien, chuong moi nhat cuoi cung).
    var chapters = [];
    for (i = 0; i < raw.length; i++) {
        if (lastIdx[raw[i].url] !== i) continue;
        chapters.push({
            name: raw[i].name,
            url: raw[i].url,
            description: "",
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + detailUrl);
    }
    return Response.success(chapters);
}
