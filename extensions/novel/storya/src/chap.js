// chap.js — doc noi dung mot chuong (execute(url) -> HTML, tieu de o data2).
//
// Noi dung chuong DU trong div.reader-content > p.whitespace-pre-line
// (tieu de chuong, ngay dang, luot doc nam NGOAI div nay, trong <article>).
// Tieu de chuong: <title> ("<ten truyen> Chương N: <ten chuong> | Storya").
// KHONG can dang nhap, khong preview, khong 401, khong VIP (kiem chung
// tu VM 2026-11-13: ch.1296 Chư Thần Ngu Hí, 9963 ky tu, mo dau "Long
// Tỉnh đã dùng mối quan hệ để tìm Trần Thuật..."; ch.1 Cuộc sống buông
// thả ở Thế giới Thiên Ma, mo dau "Ngày xuân, hương thơm lan tỏa khắp
// núi xa..." — deu dung truyen goc, ten nhan vat nhat quan).
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var u = String(url || "");
    var m = /\/(?:vi\/)?stories\/([^\/\?#]+)\/([^\/\?#]+)/.exec(u);
    if (!m) return Response.error("URL chương không hợp lệ: " + url);
    var target = toSiteUrl(u);
    var r = fetchStoryaDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Tieu de: <title> ("<ten truyen> Chương N: <ten chuong> | Storya").
    var title = "";
    var t = cleanText(String(doc.select("title").text() || ""));
    var tm = t.match(/Chương\s+\d+[^|]*/);
    if (tm) title = cleanText(tm[0]);
    if (!title) {
        var am = String(doc.select("article").text() || "").match(/Chương\s+\d+[^\n]*/);
        if (am) title = cleanText(am[0]).slice(0, 80);
    }

    var content = safeFirst(doc.select(".reader-content"));
    if (!content) return Response.error("Không tìm thấy nội dung chương tại " + target);
    content.select("script").remove();
    content.select("noscript").remove();
    content.select("iframe").remove();

    var html = String(content.html() || "");
    if (!html || !html.replace(/<[^>]*>/g, "").trim()) return Response.error("Nội dung chương trống");
    var textLen = cleanText(html.replace(/<[^>]*>/g, "")).length;
    if (textLen < 10) return Response.error("Nội dung chương trống");
    return Response.success(html, title);
}
