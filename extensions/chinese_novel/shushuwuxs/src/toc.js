// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, host}]).
//
// Muc luc nam tren trang /read_<id>/, trong #list > dl:
//   <dt>...的结局</dt> + 12 <dd> chuong moi nhat GIAM DAN
//   (2 muc quang ba 新书已发, 完本感言, chuong 325..333)
//   <dt>...正文</dt> + toan bo chuong TANG DAN (340 muc: chuong 1..
//   大结局, 完本感言, 2 muc quang ba 新书已发 o cuoi).
// LUU Y runtime: Element KHONG co children()/tagName()/parent() (xem
// extension-api.md — chi co text/html/attr/select/remove), nen khong
// the duyet con cua <dl> de dem <dt> nhu ban cu (ban cu chet tren may
// that voi TypeError: not a function, code 403 — review vong 1, 20/11).
// Thay vao do (pattern toc.js cua shuhaige): lay tat ca "dl dd a" theo
// thu tu DOM, loc link chuong theo /read_<id>/<cid>.html, bo muc quang
// ba 新书已发, dedupe GIU LAN XUAT HIEN CUOI (quet nguoc tu cuoi len
// roi dao lai) — phan duoi trang la danh sach day du tang dan nen ket
// qua dung thu tu chuong 1..N.
// Chap nhan ca URL trang truyen (/new_<id>.html) lan URL muc luc
// (/read_<id>/) va host m.shushuwuxs.com (doi ve www).
// Muc luc KHONG phan trang (1 trang duy nhat) nen khong can page.js.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// /new_<id>.html -> /read_<id>/; m. -> www.
function resolveTocUrl(url) {
    var u = normalizeUrl(url);
    var m = u.match(/\/new_(\d+)\.html$/);
    if (m) return siteOrigin() + "/read_" + m[1] + "/";
    return u;
}

function execute(url) {
    var target = resolveTocUrl(url);
    var m = target.match(/\/read_(\d+)\//);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    rateLimitDelay("shushuwuxs.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được mục lục: " + target);

    // Lay tat ca link trong <dd> theo thu tu DOM: [12 chuong moi nhat
    // giam dan] + [toan bo chuong tang dan]. Chi giu link chuong that
    // /read_<id>/<cid>.html, bo muc quang ba 新书已发.
    var links = [];
    doc.select("dl dd a").forEach(function (el) {
        var href = String(el.attr("href") || "");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf("/read_" + bookId + "/") === -1) return;
        if (href.indexOf(".html") === -1) return;
        if (name.indexOf("新书已发") === 0) return;
        links.push({
            name: name,
            url: absUrl(href),
            host: siteOrigin(),
            description: "",
            lock: false,
            pay: false
        });
    });

    if (links.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + target);
    }

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
