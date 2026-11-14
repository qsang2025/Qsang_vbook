// chap.js — Noi dung chuong cua Me Truyen Sang Tac.
//
// MO HINH KHOA (khao sat 2026-11-14): moi truyen co N chuong dau doc
// mien phi day du; chuong sau KHOA (500 Gold/chuong tren web).
// Trang chuong khoa chua div.content-preview > div.preview-text (ban
// xem truoc ~230 ky tu, cat giua cau) + div.unlock-container ("Mở khóa
// chương này (500 Gold)"). KIEM TRA KHOA TRUOC: gap cac dau hieu nay
// thi tra Response.error tieng Viet ro rang — KHONG tra ban xem truoc
// lam noi dung, KHONG mo khoa.
// Chuong mien phi: noi dung day du trong .chapter-content > .content-text.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

var LOCK_ERROR = "Chương này đã bị khóa trên Mê Truyện Sáng Tác — cần mở khóa bằng Gold trên website (500 Gold/chương). Extension không mở khóa chương VIP, bạn hãy mở khóa trên metruyensangtac.vn rồi đọc tiếp.";

function execute(url) {
    var chapUrl = resolveUrl(url);

    var r = fetchMTS(chapUrl);
    var doc = null;
    if (r.ok && r.res) {
        try { doc = r.res.html(); } catch (e) { doc = null; }
    }
    if (!doc) doc = openInBrowser(chapUrl);
    if (!doc) return Response.error(pacedErrorMessage(r));

    // Kiem tra khoa TRUOC khi lay noi dung.
    if (doc.select(".content-preview").size() > 0 ||
        doc.select(".preview-text").size() > 0 ||
        doc.select(".unlock-container").size() > 0 ||
        doc.select(".blur-overlay").size() > 0) {
        return Response.error(LOCK_ERROR);
    }

    // Tieu de chuong.
    var title = "";
    var titleEl = safeFirst(doc.select(".chuong_ten"));
    if (titleEl) title = titleEl.text().trim();

    // Noi dung chuong mien phi.
    var content = safeFirst(doc.select(".chapter-content > .content-text"));
    if (!content) content = safeFirst(doc.select(".chapter-content"));
    if (!content) content = safeFirst(doc.select("#chapter-content"));
    if (!content) content = safeFirst(doc.select(".content-chapter"));
    if (!content) content = safeFirst(doc.select("#noidungchuong"));

    // Du phong: khoi div/article/section co van ban dai nhat.
    if (!content) {
        var divs = doc.select("div, article, section");
        var bestEl = null;
        var bestLen = 0;
        var i = 0;
        for (i = 0; i < divs.size(); i++) {
            var div = divs.get(i);
            var textLen = div.text().length;
            if (textLen > 500 && textLen > bestLen) {
                var linkCount = div.select("a").size();
                if (linkCount < textLen / 200) {
                    bestLen = textLen;
                    bestEl = div;
                }
            }
        }
        content = bestEl;
    }

    if (!content) return Response.error("Không tìm thấy nội dung chương");

    content.select("script, style, iframe, noscript, ins, button, nav, footer, header").remove();
    content.select(".audio-player, .ads, .quangcao").remove();

    var html = content.html();
    if (!html || html.length < 50) return Response.error("Nội dung chương trống");
    if (content.text().trim().length < 200) return Response.error("Nội dung chương trống");

    return Response.success(html, title);
}
