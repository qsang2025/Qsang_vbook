// chap.js — Noi dung chuong: /<slug>/<slug>-chuong-N.../>.
// Noi dung day du trong div#chap-content-box (kiem chung tu VM
// 2026-11-13: ch.1 truyen mau 57 doan, ch.704 85 doan, khong quang cao,
// khong can dang nhap, khong preview, khong khoa). Loai bo doan rong.
// Ten chuong lay tu div trong h1 (dang "Chuong 1" / "CHUONG 18").
// Neu khong tim thay noi dung thi kiem tra dau hieu dang nhap/khoa
// chuong trong HTML tho truoc khi bao loi — chuong VIP (neu co) bao loi
// tieng Viet ro rang, khong mo khoa.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchZtruyenPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var contentEl = safeFirst(doc.select("#chap-content-box"));
    if (!contentEl) contentEl = safeFirst(doc.select(".chap-content"));

    if (contentEl) {
        contentEl.select("script, style, .quang-cao, .ads, .adsbygoogle").remove();
        var html = contentEl.html();
        if (html && html.trim().length > 0) {
            html = html.replace(/<p[^>]*>\s*(<br[^>]*>)?\s*<\/p>/gi, "");
            var title = "";
            var h1 = safeFirst(doc.select("h1"));
            if (h1) {
                var titleDiv = safeFirst(h1.select("div"));
                title = cleanText(titleDiv ? titleDiv.text() : h1.text());
            }
            return Response.success(cleanHtml(html), title);
        }
    }

    var raw = String(r.rawHtml || "").toLowerCase();
    if (raw.indexOf("chương vip") !== -1 || raw.indexOf("chuong vip") !== -1) {
        return Response.error("Chương này là chương VIP — cần mua bằng xu trên ztruyen.vn, extension không mở khóa chương trả phí.");
    }
    if (raw.indexOf("đăng nhập") !== -1 && raw.indexOf("để đọc") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập — hãy đăng nhập trên ztruyen.vn rồi thử lại.");
    }
    if (raw.indexOf("cần mua") !== -1 || raw.indexOf("mua chương") !== -1) {
        return Response.error("Chương này yêu cầu mua — extension không mở khóa chương trả phí.");
    }
    return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
}
