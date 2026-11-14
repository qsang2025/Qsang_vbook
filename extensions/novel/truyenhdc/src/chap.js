// chap.js — Noi dung 1 chuong TruyenHD (truyenhdc.com).
//
// Chuong /truyen/<slug>/chap/<id>-chuong-<n>/: noi dung trong
// .reading, text tho ngan cach <br><br> (ch.1 mau: 2.917 ky tu, mo
// dau "Lao xao. Nhat Da than trong re dam co dai..."). Co 2 dang
// nhu truyenhoangdung: nhieu the <p> thi giu html goc (bo <p> rong),
// 1 khoi text ngan cach <br> thi tach thanh tung <p>.
// Tieu de chuong: <title> dang "Ten truyen - Chuong N: ..." — cat
// lay phan sau " - Chuong".
// Chuong trong hoac text qua ngan thi bao loi tieng Viet ro rang —
// co the la chuong VIP / bi khoa, KHONG mo khoa (khong dung co che
// password cua base).
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link chương không hợp lệ.");
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = selFirst(doc, ".reading");
    if (!contentEl) return Response.error("Không đọc được nội dung chương (chương có thể đã bị khóa hoặc không tồn tại): " + full);
    var html = contentEl.html() || "";
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

    var title = "";
    var titleEl = selFirst(doc, "title");
    if (titleEl) {
        var t = cleanText(titleEl.text());
        var idx = t.indexOf(" - Chương");
        if (idx >= 0) title = t.substring(idx + 3);
        else title = t;
    }
    if (!title) {
        var h1El = selFirst(doc, "h1");
        if (h1El) title = cleanText(h1El.text());
    }

    var pEls = contentEl.select("p");
    var realP = 0;
    for (var i = 0; i < pEls.size(); i++) {
        if (cleanText(pEls.get(i).text())) realP++;
    }
    if (realP >= 2) {
        // Dang nhieu doan <p> — giu html goc, bo doan <p> rong.
        var out = html.replace(/<p>\s*<\/p>/gi, "");
        if (cleanText(out.replace(/<[^>]+>/g, " ")).length < 50) {
            return Response.error("Chương này không có nội dung để đọc (có thể là chương trả phí hoặc đã bị khóa): " + full);
        }
        return Response.success(out, title);
    }

    // Dang 1 khoi text ngan cach bang <br> — tach thanh tung <p>.
    var paras = [];
    var parts = html.split(/<br\s*\/?>\s*(?:<br\s*\/?>\s*)+/gi);
    for (var j = 0; j < parts.length; j++) {
        var t2 = cleanText(parts[j].replace(/<[^>]+>/g, " "));
        if (!t2) continue;
        paras.push("<p>" + t2 + "</p>");
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
    return Response.success(joined, title);
}
