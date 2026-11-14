// chap.js — Noi dung 1 chuong Me Doc Truyen Chu (medoctruyenchu.net).
//
// Chuong /<slug>/chuong-<N>: noi dung trong .chapter-content, van ban
// tho ngan cach bang <br><br> (co the bat dau bang dong "Edit: <ten>"
// ghi cong bien tap). Bo the <style> trong va khoi quang cao
// (#ads-chapter-pc-top, .incontent-ad) truoc khi tra ve. Doi cac doan
// ngan cach bang <br> thanh the <p> cho app hien thi sach se.
// Tieu de chuong: <p class="text-center text-dark"> ("Chương 1"),
// fallback ve <title>. Tra Response.success(html, tieu de).
// Chuong that + du (kiem chung live 2026-11-14: ch.1 Ta Có Một Toà Đạo
// Quan 122 doan / 14.057 ky tu; ch.177 cuoi 422 doan / 61.058 ky tu).
// Khong co chuong VIP / preview tren site (0 marker tren cac trang da
// kiem) — neu gap trang chuong trong hoac chi co thong bao khoa thi bao
// loi tieng Viet ro rang, khong mo khoa.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link chương không hợp lệ.");
    var r = mdcFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = selFirst(doc, ".chapter-content");
    if (!contentEl) return Response.error("Không đọc được nội dung chương (chương có thể đã bị khóa hoặc không tồn tại): " + full);
    var html = contentEl.html() || "";
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<div[^>]*id="ads-chapter-pc-top"[^>]*>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/<div[^>]*incontent-ad[^>]*>[\s\S]*?<\/div>/gi, "");

    var parts = html.split(/<br\s*\/?>\s*(?:<br\s*\/?>\s*)+/gi);
    var paras = [];
    for (var i = 0; i < parts.length; i++) {
        var t = cleanText(parts[i].replace(/<[^>]+>/g, " "));
        if (!t) continue;
        paras.push("<p>" + t + "</p>");
    }
    // Doan don: noi dung chi co <br> don, khong co <br><br>.
    if (paras.length === 0) {
        var plain = cleanText(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
        if (plain) paras.push("<p>" + plain + "</p>");
    }
    if (paras.length === 0) {
        return Response.error("Chương này không có nội dung để đọc: " + full);
    }
    var out = paras.join("");

    var title = "";
    var titleEl = selFirst(doc, ".chapter-wrapper p.text-center.text-dark");
    if (titleEl) title = cleanText(titleEl.text());
    if (!title) {
        var tEl = selFirst(doc, "title");
        if (tEl) title = cleanText(tEl.text());
    }
    return Response.success(out, title);
}
