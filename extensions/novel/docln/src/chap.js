// chap.js — doc noi dung mot chuong (execute(url) -> HTML, tieu de o data2).
//
// Noi dung chuong MA HOA trong div#chapter-c-protected (xem file helper.js):
// data-s = scheme (xor_shuffle / base64_reverse / mac dinh base64),
// data-k = key XOR, data-c = mang JSON cac chunk (4 ky tu dau la so thu tu).
// Giai ma duoc tu JS cong khai cua site (scripts/app.js) — khong can dang
// nhap, khong preview, khong 401. Da kiem chung tu VM 2026-11-13: ch.1
// Nang Hau Gai (62 doan, 7832 ky tu) va ch.1 Toi Yeu Nu Phan Dien (47 doan,
// 8797 ky tu) deu ra dung van tieng Viet goc.
// Tieu de chuong: <p style="display: none"> trong #chapter-content;
// fallback: <title> ("Đọc <ten truyen> - Chương ... - Cổng Light Novel").
// Chuong chi co anh minh hoa thi noi dung giai ma gan nhu rong (site an anh
// voi khach) — tra loi ro rang thay vi chuong rong.
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
    var u = String(url || "");
    var m = u.match(/\/(?:truyen|sang-tac)\/\d+[^\/]*\/(c\d+-[^\/\?#]+)/);
    if (!m) return Response.error("URL chương không hợp lệ: " + url);
    var target = toSiteUrl(u);

    var r = fetchDoclnDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Tieu de: <p style="display: none"> trong #chapter-content.
    var title = "";
    var hiddenTitle = safeFirst(doc.select("#chapter-content p[style*=\"display: none\"]"));
    if (hiddenTitle) title = cleanText(hiddenTitle.text());
    if (!title) {
        var t = cleanText(String(doc.select("title").text() || ""));
        var tm = t.match(/Chương[^–\-]+/);
        if (tm) title = cleanText(tm[0]);
        else title = cleanText(t.replace(/\s*-\s*Cổng Light Novel.*$/, "").replace(/^Đọc\s+/, ""));
    }

    var html = "";
    var prot = safeFirst(doc.select("#chapter-c-protected"));
    if (prot) {
        html = decodeProtectedContent(prot);
    }
    if (!html) {
        // Fallback: chuong khong ma hoa — lay thang #chapter-content.
        var cont = safeFirst(doc.select("#chapter-content"));
        if (cont) {
            cont.select("script, style").remove();
            var hid = safeFirst(cont.select("p[style*=\"display: none\"]"));
            if (hid) hid.remove();
            html = String(cont.html() || "");
            html = html.replace(/<img[^>]*>/gi, "");
        }
    }
    if (!html) return Response.error("Không tìm thấy nội dung chương tại " + target);

    // Cat ria va gon cac doan <p> rong lien tiep.
    html = html.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, "");
    html = html.replace(/(<p>\s*(?:&nbsp;|<br\s*\/?\s*>)?\s*<\/p>\s*){2,}/gi, "");
    var textLen = cleanText(html.replace(/<[^>]*>/g, "")).length;
    if (textLen < 10) {
        return Response.error("Chương này chủ yếu là hình minh họa, site chỉ hiện ảnh khi đã đăng nhập — không đọc được nội dung chữ.");
    }
    return Response.success(html, title);
}
