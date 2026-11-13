// chap.js — Noi dung chuong: /<slug>/chuong-N[-<slug>] (301 ve dang co
// slash cuoi — fetch tu theo redirect).
// Noi dung day du trong div.uk-width-1-1.reading (kiem chung tu VM
// 2026-11-14: ch.1 truyen mau 103 doan, mo dau "Chu Tu Triet ban chuyen
// gi vay?..."; ch.7 164 doan; ch.17 truyen khac 42 doan; khong quang cao
// trong div, khong can dang nhap, khong preview, khong khoa).
// Doan dau co the la "<p>1</p>" / "<p>17</p>" (so chuong roi) — loc bo
// doan chi co chu so va doan rong. Ten chuong lay tu a.chapter-title
// trong h2 (trang chuong khong co h1), fallback ve <title>.
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
    var r = fetchVivuPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var contentEl = safeFirst(doc.select(".reading"));
    if (!contentEl) contentEl = safeFirst(doc.select(".uk-width-1-1.reading"));

    if (contentEl) {
        contentEl.select("script, style, ins, noscript, iframe, button, .adsense, .adsbygoogle, .ad, [class*='ads']").remove();
        var paras = contentEl.select("p");
        var toRemove = [];
        for (var pi = 0; pi < paras.size(); pi++) {
            var pText = cleanText(paras.get(pi).text());
            // Doan chi co chu so o dau chuong la so chuong roi, khong
            // phai noi dung truyen (gap o ch.1: "<p>1</p>", ch.7: "<p>17</p>").
            if (/^\d+$/.test(pText) || pText === "") {
                toRemove.push(paras.get(pi));
            } else {
                break;
            }
        }
        for (var ri = 0; ri < toRemove.length; ri++) {
            toRemove[ri].remove();
        }
        var html = contentEl.html();
        if (html && html.trim().length > 0) {
            html = html.replace(/<p[^>]*>\s*(<br[^>]*>)?\s*<\/p>/gi, "");
            var title = "";
            var titleEl = safeFirst(doc.select("a.chapter-title"));
            if (titleEl) title = cleanText(titleEl.text());
            if (!title) {
                var titleTag = safeFirst(doc.select("title"));
                if (titleTag) {
                    title = cleanText(titleTag.text()).replace(/ - vivutruyen\.net$/i, "").trim();
                }
            }
            return Response.success(cleanHtml(html), title);
        }
    }

    var raw = String(r.rawHtml || "").toLowerCase();
    if (raw.indexOf("chương vip") !== -1 || raw.indexOf("chuong vip") !== -1) {
        return Response.error("Chương này là chương VIP — cần mua trên vivutruyen.net, extension không mở khóa chương trả phí.");
    }
    if (raw.indexOf("đăng nhập") !== -1 && raw.indexOf("để đọc") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập — hãy đăng nhập trên vivutruyen.net rồi thử lại.");
    }
    if (raw.indexOf("cần mua") !== -1 || raw.indexOf("mua chương") !== -1) {
        return Response.error("Chương này yêu cầu mua — extension không mở khóa chương trả phí.");
    }
    return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
}
