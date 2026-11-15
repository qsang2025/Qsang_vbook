// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /read/<cat>/<id>/<n>.html (kiem chung live 2026-11-16
// voi 他怎么又不是人了？ ch.1 /read/41/60801/2.html va chuong cuoi
// /read/41/60801/284.html; va 全世界众筹复活本反派 ch.1
// /read/11/60720/2.html):
// - Noi dung trong #view_content_txt (cac <p>); trang 1 la gioi thieu
//   sach, tu trang 2 la chuong that — muc luc da tro dung URL nen
//   chap.js khong can phan biet.
// - Chuong 1: 3.817 ky tu, 100 <p>, mo dau "第1章 人死成鬼" + noi dung
//   that; chuong cuoi: 817 ky tu (hoi dap番外). Khong co khoi dau trang
//   kieu 作者：/简介： trong #view_content_txt, khong can cat.
// - Khong co trang chia trong chuong (khong co _2.html); khong co khoa
//   VIP / dang nhap / preview.
// - Tieu de trong h1 dang "Ten truyen  第N章 Ten chuong" -> lay phan
//   "第N章..." (khop cach dat ten trong muc luc); neu khong tach duoc
//   thi dung nguyen h1.
// - Link trong #view_content_txt (neu co) bi go bo, chi giu chu.
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
    var chapUrl = String(url || "");
    if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
    chapUrl = normalizeStoryUrl(normalizeUrl(chapUrl));
    var r = fetchIjDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("#view_content_txt"));
    if (contentEl === null) {
        return Response.error("Không đọc được nội dung chương: " + chapUrl);
    }
    // Go link trong noi dung (quang cao / dieu huong), giu lai chu.
    contentEl.select("a").remove();

    var ps = contentEl.select("p");
    if (ps.size() === 0) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }

    var parts = [];
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (t) parts.push("<p>" + t + "</p>");
    }
    var html = parts.join("");
    if (!html || cleanText(stripTags(html)).length < 20) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }

    // Tieu de chuong: h1 "Ten truyen  第N章 Ten chuong" -> lay phan "第N章...".
    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) {
        var raw = cleanText(h1.text());
        var m = /(第\d+章.*)/.exec(raw);
        if (m) title = m[1];
        else {
            var m2 = /(第\d+节.*)/.exec(raw);
            if (m2) title = m2[1];
            else title = raw;
        }
    }
    if (!title) title = "Chương";

    return Response.success(html, title);
}
