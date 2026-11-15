// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /<the loai>/<id>/<n>.html (kiem chung live 2026-11-15):
// - Noi dung trong div.read_chapterDetail (cac <p>).
// - Tieu de trong h1 dang "Ten truyen 第N章" -> cat ten truyen, giu
//   phan "第N章..." (neu khong tach duoc thi dung nguyen h1).
// - Khong co trang chia trong chuong (khong co marker (1/2)); nav
//   首章/下一章/尾章/目錄 chi la dieu huong giua cac chuong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var chapUrl = String(url || "");
    if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
    chapUrl = normalizeUrl(chapUrl);
    var r = fetchJxDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("div.read_chapterDetail"));
    if (contentEl === null) {
        return Response.error("Không đọc được nội dung chương: " + chapUrl);
    }
    var html = cleanHtml(contentEl.html());
    if (!html || cleanText(stripTags(html)).length < 20) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }

    // Tieu de chuong: h1 "Ten truyen 第N章" -> lay phan sau ten truyen.
    var title = "";
    var h1 = safeFirst(doc.select("div.read_chapterName h1"));
    if (h1 !== null) {
        var raw = cleanText(h1.text());
        var idx = raw.lastIndexOf(" 第");
        if (idx !== -1) {
            title = raw.substring(idx + 1);
        } else {
            title = raw;
        }
    }
    if (!title) title = "Chương";

    return Response.success(html, title);
}
