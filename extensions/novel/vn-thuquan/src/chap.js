// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /TacPham/<slug>-<id>/chuong-<n> (kiem chung live 2026-11-16):
// - Tieu de: div.chuongso_a KHONG RONG CUOI CUNG (div dau thuong rong
//   hoac ghi thong tin dich gia, div sau moi la ten chuong that);
//   neu khong co thi lay div.tuahoi_a cuoi cung, cat o ranh gioi tu.
// - Noi dung: #vntqTextContent — CO SAN trong HTML tinh, fetch truc tiep
//   du (khong can WebView). Chuong 2 Tay Son: 168 doan <p>, 19.928 ky tu
//   van xuoi that; chuong 1 (Loi Mo Dau): 4 doan, 6.727 ky tu. Trong div
//   co the co 1 anh minh hoa — giu nguyen.
// - Khong co paywall tren cac chuong da kiem; link "Đăng nhập" chi nam o
//   nav chung cua site nen KHONG dung no lam dau hieu chan. Chi bao loi
//   khi chinh noi dung chuong noi ro yeu cau dang nhap/tra phi.
// Tra Response.success(html, tieu de chuong).
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeVntqUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    var r = fetchVntqDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("#vntqTextContent"));
    if (contentEl === null) return Response.error("Không đọc được nội dung chương.");

    var plain0 = cleanText(contentEl.text());
    if (plain0.indexOf("yêu cầu đăng nhập") !== -1 || plain0.indexOf("đăng nhập để đọc") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập nên không đọc được miễn phí.");
    }
    if (plain0.indexOf("cần trả phí") !== -1 || plain0.indexOf("mua chương") !== -1) {
        return Response.error("Chương này cần trả phí nên không đọc được miễn phí.");
    }

    // Tieu de: div.chuongso_a — trang co 2 div nay: div dau thuong rong
    // hoac ghi thong tin dich gia ("Dịch giả : ..."), div sau moi la ten
    // chuong that (vd. "Lời Mở Đầu", "Phần 1 - Chương 1", "Hồi 1") nen
    // lay div KHONG RONG CUOI CUNG. Neu khong co thi lay div.tuahoi_a
    // cuoi cung (tieu de phu cua chuong), cat o ranh gioi tu <= 120 ky tu.
    var title = "";
    var tEls = doc.select("div.chuongso_a");
    for (var ti = 0; ti < tEls.size(); ti++) {
        var tt = cleanText(tEls.get(ti).text());
        if (tt) title = tt;
    }
    if (!title) {
        var sEls = doc.select("div.tuahoi_a");
        for (var si = 0; si < sEls.size(); si++) {
            var st = cleanText(sEls.get(si).text());
            if (st) title = st;
        }
        if (title.length > 120) {
            var cut = title.substring(0, 120);
            var sp = cut.lastIndexOf(" ");
            if (sp > 60) cut = cut.substring(0, sp);
            title = cut;
        }
    }

    var html = contentEl.html() + "";
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<p[^>]*>\s*(<b>\s*<\/b>)?\s*<\/p>/gi, "");
    html = html.replace(/&nbsp;/gi, " ");
    html = html.replace(/<br\s*\/?>/gi, "<br>");
    html = html.replace(/(<br>\s*){3,}/g, "<br><br>");
    html = html.replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/g, "");
    html = html.trim();
    if (!html) return Response.error("Không đọc được nội dung chương.");
    var plain = stripTags(html).replace(/\s+/g, " ").trim();
    if (plain.length < 50) return Response.error("Không đọc được nội dung chương.");

    return Response.success(html, title);
}
