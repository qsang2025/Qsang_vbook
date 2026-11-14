// chap.js — Noi dung 1 chuong Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Chuong /<slug>/chuong-<N>/ (ca khi mat dau / cuoi van 200): noi dung
// trong #noidung. Co 2 dang:
// - Nhieu the <p> (Am Duong ch.1: 100 doan, 14.612 ky tu) — tra html
//   goc, chi bo the <p> rong.
// - 1 the <p> ngan cach bang <br><br> (Co Chan Nhan ch.1: 16.941 ky
//   tu) — tach thanh tung <p>.
// Tieu de chuong: <title> ("Chương:1 Âm Dương Quỷ Đạo (Dịch)").
// Chuong that + du (kiem chung live 2026-11-14). Neu #noidung trong
// hoac text qua ngan thi bao loi tieng Viet ro rang — co the la chuong
// tra phi / bi khoa, khong mo khoa.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link chương không hợp lệ.");
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = selFirst(doc, "#noidung");
    if (!contentEl) return Response.error("Không đọc được nội dung chương (chương có thể đã bị khóa hoặc không tồn tại): " + full);
    var html = contentEl.html() || "";
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

    var paras = [];
    var pEls = contentEl.select("p");
    var realP = 0;
    for (var i = 0; i < pEls.size(); i++) {
        if (cleanText(pEls.get(i).text())) realP++;
    }
    if (realP >= 2) {
        // Dang nhieu doan <p> — giu html goc, bo doan <p> rong.
        var out = html.replace(/<p>\s*<\/p>/gi, "");
        var title = "";
        var tEl = selFirst(doc, "title");
        if (tEl) title = cleanText(tEl.text());
        if (cleanText(out.replace(/<[^>]+>/g, " ")).length < 50) {
            return Response.error("Chương này không có nội dung để đọc (có thể là chương trả phí hoặc đã bị khóa): " + full);
        }
        return Response.success(out, title);
    }

    // Dang 1 doan <p> ngan cach bang <br> — tach thanh tung <p>.
    var parts = html.split(/<br\s*\/?>\s*(?:<br\s*\/?>\s*)+/gi);
    for (var j = 0; j < parts.length; j++) {
        var t = cleanText(parts[j].replace(/<[^>]+>/g, " "));
        if (!t) continue;
        paras.push("<p>" + t + "</p>");
    }
    if (paras.length === 0) {
        var plain = cleanText(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
        if (plain) paras.push("<p>" + plain + "</p>");
    }
    if (paras.length === 0) {
        return Response.error("Chương này không có nội dung để đọc (có thể là chương trả phí hoặc đã bị khóa): " + full);
    }
    var joined = paras.join("");
    if (cleanText(joined.replace(/<[^>]+>/g, " ")).length < 50) {
        return Response.error("Chương này không có nội dung để đọc (có thể là chương trả phí hoặc đã bị khóa): " + full);
    }
    var title2 = "";
    var tEl2 = selFirst(doc, "title");
    if (tEl2) title2 = cleanText(tEl2.text());
    return Response.success(joined, title2);
}
