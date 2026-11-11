// chap.js — Nội dung chương
// Contract: execute(url) → htmlString (KHÔNG phải object!)
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = wikiNormalizeUrl(url);

    rateLimitDelay("wikicv.org");
    var res = wikiFetch(url);
    if (!res.ok) return Response.error("Không tải được chương (HTTP " + res.status + ")");

    var doc = res.html();

    // Xóa quảng cáo và phần thừa
    doc.select("script, style, ins, iframe, .ads, .advertisement, .banner, .quangcao").remove();
    doc.select("[class*='ads'], [id*='ads'], .fb-comments, #fb-comments").remove();

    // Nội dung chương nằm trong #bookContentBody
    // (dung wikiFirst: .first() cua runtime khong bao gio tra null nen
    // guard if (!contentEl) cu khong bao gio chay — xem config.js)
    var contentEl = wikiFirst(doc.select("#bookContentBody"));
    if (!contentEl) return Response.error("Không tìm thấy nội dung chương");

    var content = contentEl.html() + "";

    // Làm sạch HTML entities thừa
    content = content.replace(/&nbsp;/g, " ");

    return Response.success(content);
}