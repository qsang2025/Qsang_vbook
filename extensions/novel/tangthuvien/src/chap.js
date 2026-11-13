// chap.js — Noi dung chuong: /<slug>/<n>.
// Noi dung day du trong div[class*=source_serif] (kiem chung tu VM
// 2026-11-13: ch.1 truyen mau 171 doan, khong quang cao, khong can dang
// nhap, khong preview, khong 401, khong khoa). Loai bo doan rong.
// Neu khong tim thay noi dung thi kiem tra chu khoa dang nhap/khoa
// chuong trong HTML tho truoc khi bao loi.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTtvPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var contentEl = safeFirst(doc.select("div[class*=source_serif]"));
    if (!contentEl) contentEl = safeFirst(doc.select("div.py-2.flex.flex-col.gap-4"));

    if (contentEl) {
        contentEl.select("script, style, .quang-cao, .ads, .adsbygoogle").remove();
        var html = contentEl.html();
        if (html && html.trim().length > 0) {
            // Site dung <p> rong lam dau ngat doan (moi doan that cach
            // nhau bang 1 <p></p>) — loai cac doan rong truoc khi tra ve.
            html = html.replace(/<p[^>]*>\s*(<br[^>]*>)?\s*<\/p>/gi, "");
            var title = "";
            var h1 = safeFirst(doc.select("h1"));
            if (h1) title = cleanText(h1.text());
            return Response.success(cleanHtml(html), title);
        }
    }

    var raw = String(r.rawHtml || "").toLowerCase();
    if (raw.indexOf("đăng nhập") >= 0 && raw.indexOf("mở khóa") >= 0) {
        return Response.error("Chương này yêu cầu đăng nhập / mở khóa — hãy đăng nhập trên trang Tàng Thư Viện rồi thử lại.");
    }
    if (raw.indexOf("đăng nhập") >= 0) {
        return Response.error("Chương này yêu cầu đăng nhập — hãy đăng nhập trên trang Tàng Thư Viện rồi thử lại.");
    }
    return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
}
