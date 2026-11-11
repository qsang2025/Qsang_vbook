// toc.js — muc luc chuong cua 书海阁 (shuhaige.tw).
// Muc luc 1 TRANG DUY NHAT, khong phan trang -> KHONG can page.js.
// URL: detail /{id}.html -> thu muc TOC /{id}/ (app strip trailing "/"
// khoi URL arg nen toc.js nhan "/649" van phai tu them "/" truoc khi fetch).
// Toan bo chuong trong mot <dl>: dt[0] la chuong moi nhat (12 <dd> giam
// dan) + dt[1] "章节列表" (toan bo tang dan). Tong 3.106 <dd> nhung chi
// 3.094 href duy nhat -> BAT BUOC dedupe theo href.
// LUU Y runtime: Element khong co children()/tagName()/parent() (xem
// extension-api.md — chi co text/html/attr/select/remove), nen khong the
// duyet con cua <dl> de dem <dt>. Thay vao do: lay tat ca "dl dd a" theo
// thu tu DOM ([12 chuong moi giam dan] + [toan bo tang dan]), dedupe GIU
// LAN XUAT HIEN CUOI (quet nguoc tu cuoi len roi dao lai) — phan duoi
// trang la danh sach day du tang dan nen ket qua dung thu tu chuong 1..N.
// KIEM CHUNG LIVE 2026-11-09 (C2): TOC la 1 <dl> duy nhat voi 2 <dt>:
// dt[0] "…的结局" = 12 chuong moi nhat GIAM DAN (3094->3083), dt[1]
// "…章节列表" = toan bo 3094 chuong TANG DAN (1->3094). 12 href lap lai
// chinh la 12 chuong moi nhat (3083-3094), xuat hien o dau (giam dan)
// roi lap lai o cuoi danh sach day du (tang dan). Vi vay dedupe GIU LAN
// CUOI moi dung: giu lan dau se cho thu tu sai (3094…3083, 1…3082).
// Neu muc luc hien sai thu tu thi kiem tra thu tu 2 khoi <dt> tren trang
// TOC truoc — hanh vi nay phu thuoc vao thu tu DOM do.
// Khong co chuong khoa VIP.
// Vi du: /649/ 《大道主》 3.094 chuong, chuong 1 第1章 青蝉献身,
// chuong cuoi 第3094章 见识 -> /649/7566186.html.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var tocUrl = BASE_URL + "/" + bookId + "/";
    var doc = fetchDocWithFallback(tocUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được mục lục: " + tocUrl);

    var links = [];
    doc.select("dl dd a").forEach(function (el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf("/" + bookId + "/") === -1) return;
        if (href.indexOf(".html") === -1) return;
        links.push({
            name: name,
            url: absUrl(href),
            description: "",
            lock: false,
            pay: false
        });
    });

    if (links.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);

    // Dedupe giu lan xuat hien CUOI: quet nguoc tu cuoi len (phan duoi
    // trang la danh sach day du tang dan), roi dao lai ve thu tu tang dan.
    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = links.length - 1; i >= 0; i--) {
        var link = links[i].url;
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push(links[i]);
    }
    chapters.reverse();

    return Response.success(chapters);
}
