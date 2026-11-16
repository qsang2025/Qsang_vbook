// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /book/<id>/<n>.html (kiem chung live 2026-11-16):
// - Tieu de: h1 ("第1章 断肠人，在天涯").
// - Noi dung: #TextContent — CO SAN trong HTML tinh, fetch truc tiep
//   du (khong can WebView). Dau div co 3 the dt thua (script chap_tp(),
//   theme()) + &emsp; — cat bo dt/script, doi &emsp;/&nbsp; thanh khoang
//   trang. Cuoi chuong sach, khong co quang cao trong div.
// - Khong co marker login/pay tren cac trang chuong da kiem (ch.1 7.871
//   ky tu, ch.2 8.987 ky tu, deu doc du).
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
    url = normalizeDmUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    var r = fetchDmDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var bodyText = String(doc.select("body").text() || "");
    if (bodyText.indexOf("登录") !== -1 || bodyText.indexOf("登入") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập nên không đọc được miễn phí.");
    }
    if (bodyText.indexOf("付费") !== -1 || bodyText.indexOf("购买") !== -1) {
        return Response.error("Chương này cần trả phí nên không đọc được miễn phí.");
    }

    var contentEl = safeFirst(doc.select("#TextContent"));
    if (contentEl === null) return Response.error("Không đọc được nội dung chương.");

    var title = "";
    var h1El = safeFirst(doc.select("h1"));
    if (h1El !== null) title = cleanText(h1El.text());

    var html = contentEl.html() + "";
    html = html.replace(/<dt[\s\S]*?<\/dt>/gi, "");
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/&emsp;/gi, " ");
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
