// chap.js — Noi dung chuong: /<slug>/chuong-<n>-<ten>.html.
// Noi dung day du trong #chapter-content-render (khong can dang nhap,
// khong preview, khong 401). Span chong copy (:before) duoc giai ma
// truoc khi lay html.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTruyenmoPage(url);
    if (r.error) return Response.error(r.error);

    // Giai ma span chong copy (:before) tren CHUOI HTML truoc khi parse —
    // runtime vBook khong co Element.before() nen khong giai ma tren DOM
    // duoc (xem helper.js).
    var doc = Html.parse(decodeObfuscatedHtml(r.rawHtml, r.rawHtml));
    if (!doc) return Response.error('Không thể parse HTML');

    var contentEl = safeFirst(doc.select('#chapter-content-render'));
    if (!contentEl) contentEl = safeFirst(doc.select('.chapter-content .content-container'));
    if (!contentEl) contentEl = safeFirst(doc.select('.chapter-content'));
    if (!contentEl) return Response.error('Không tìm thấy nội dung chương');

    contentEl.select('script, iframe, style, .ads, .adsbygoogle, .quang-cao, .chapter-nav, .chapter-tools, .comments, .chapter-comment, .my-4').remove();
    contentEl.select('.signature, p.signature').remove();
    contentEl.select('.affClick').remove();
    var affActive = contentEl.select('.affActive');
    if (affActive && affActive.size() > 0) {
        affActive.attr('style', '');
    }
    contentEl.select('[style*="display:none"], [style*="display: none"], [style*="font-size:0"], [style*="font-size: 0"], [hidden]').remove();

    var content = contentEl.html();
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<\/?(?:html|head|body)[^>]*>/gi, '');
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/<p>\s*(?:&nbsp;|\u00a0|<br\s*\/?>)*\s*<\/p>/gi, '<br>');
    content = content.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>');

    if (!cleanText(content.replace(/<[^>]+>/g, ' '))) {
        return Response.error('Nội dung chương trống — có thể chương này chỉ có hình hoặc đã bị gỡ.');
    }

    return Response.success(content);
}
