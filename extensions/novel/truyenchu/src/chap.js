// chap.js — Noi dung chuong: /truyen/<slug>/chuong-N/.
// Noi dung day du trong .reading-content .text-left (kiem chung tu VM
// 2026-11-13: QAN ch.1 3 doan, 9474 ky tu; MTK ch.1 1 doan, 13210 ky tu;
// khong quang cao, khong can dang nhap, khong preview, khong khoa).
// Loai bo doan boilerplate cuoi chuong "Copyright to Truyen Chu.
// Website dang trong qua trinh thu nghiem" (gap o QAN ch.2141) va doan
// rong. Ten chuong lay tu h1 (dang "Quang Am Chi Ngoai - Chuong 1" —
// lay phan sau " - "). Neu khong tim thay noi dung thi kiem tra dau
// hieu dang nhap/khoa chuong trong HTML tho truoc khi bao loi — chuong
// VIP (neu co) bao loi tieng Viet ro rang, khong mo khoa.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTruyenchuPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var contentEl = safeFirst(doc.select(".reading-content .text-left"));
    if (!contentEl) contentEl = safeFirst(doc.select(".reading-content"));

    if (contentEl) {
        contentEl.select("script, style, ins, noscript, iframe, button, .adsense, .adsbygoogle, .ad, [class*='ads']").remove();
        // Bo doan boilerplate cuoi chuong cua site (khong phai noi dung truyen).
        var paras = contentEl.select("p");
        for (var pi = paras.size() - 1; pi >= 0; pi--) {
            var pEl = paras.get(pi);
            var pText = cleanText(pEl.text());
            if (pText.indexOf("Copyright to Truyện Chữ") !== -1 ||
                pText.indexOf("đang trong quá trình thử nghiệm") !== -1) {
                pEl.remove();
            }
        }
        var html = contentEl.html();
        if (html && html.trim().length > 0) {
            html = html.replace(/<p[^>]*>\s*(<br[^>]*>)?\s*<\/p>/gi, "");
            var title = "";
            var h1 = safeFirst(doc.select("h1"));
            if (h1) {
                title = cleanText(h1.text());
                var dash = title.indexOf(" - ");
                if (dash !== -1) {
                    var tail = title.substring(dash + 3).trim();
                    if (tail.indexOf("Chương") === 0) title = tail;
                }
            }
            return Response.success(cleanHtml(html), title);
        }
    }

    var raw = String(r.rawHtml || "").toLowerCase();
    if (raw.indexOf("chương vip") !== -1 || raw.indexOf("chuong vip") !== -1) {
        return Response.error("Chương này là chương VIP — cần mua bằng xu trên truyenchu.net, extension không mở khóa chương trả phí.");
    }
    if (raw.indexOf("đăng nhập") !== -1 && raw.indexOf("để đọc") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập — hãy đăng nhập trên truyenchu.net rồi thử lại.");
    }
    if (raw.indexOf("cần mua") !== -1 || raw.indexOf("mua chương") !== -1) {
        return Response.error("Chương này yêu cầu mua — extension không mở khóa chương trả phí.");
    }
    return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
}
