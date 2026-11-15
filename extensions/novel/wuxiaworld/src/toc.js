// toc.js — Muc luc: 1 trang chi tiet tra 100 muc.
//
// Input: URL chi tiet truyen (co the kem ?toc=N — page.js tra ve cac
// URL trang muc luc). Moi muc: ul.toc li a (ten day du trong text cua
// link, href la URL chuong tuyet doi sau khi chuan hoa). Trang muc luc
// KHONG danh dau chuong khoa/xem truoc nen toc.js khong gan lock/pay;
// chap.js se bao ro trang thai khi mo chuong.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var chapters = [];
    var seen = {};
    var links = doc.select("ul.toc li a");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var href = el.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var name = cleanText(el.text());
        if (!name) continue;
        chapters.push({ name: name, url: link, host: BASE_URL });
    }
    if (chapters.length === 0) return Response.error("Không đọc được mục lục: " + url);
    return Response.success(chapters);
}
