// chap.js — Noi dung 1 chuong truyen Ky Huyen (kyhuyen.com).
//
// Trang chuong `/truyen/<slug>/chuong-<N>/<id>` (HTML tinh, kiem chung live
// 2026-11-18): noi dung o .story-content article, cac doan tach nhau bang
// <br/><br/>; tieu de chuong o the <title> ("Ten truyen - Chuong N: ...").
// Watermark chen trong bai: <span class="d-none">…yhuyen com</span> va the
// <a href="https://kyhuyen.com">KyHuyen.com</a> (ke ca dau "." con sot
// lai sau khi cat the), cong them khoi quang cao (script/div quang cao
// chen giua cac doan) — deu loc sach truoc khi tra ve.
// Chuong doc du, khong login/VIP. execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    var r = fetchKyDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select(".story-content article"));
    if (contentEl === null) contentEl = safeFirst(doc.select(".story-content"));
    if (contentEl === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);

    // Loc sach: script/style/iframe, quang cao, watermark an (d-none),
    // the a dan ve trang chu, div quang cao chen giua cac doan.
    contentEl.select("noscript, style, script, iframe, ins, .ads-class, .pikachu, .d-none").remove();
    contentEl.select("a").remove();
    contentEl.select("div").remove();

    var htmlContent = contentEl.html() || "";
    if (!htmlContent) return Response.error("Nội dung chương trống: " + chapUrl);

    // Don dep dau "." con sot lai sau khi cat watermark/the a, va ky tu
    // trang tri cua watermark (ⓚyhuyen com).
    htmlContent = htmlContent
        .replace(/<p>\s*\.\s*/g, "<p>")
        .replace(/(?:^|>)\s*\.\s*(?=[^<])/g, "$1")
        .replace(/ⓚ|к/g, "k")
        .replace(/ⓒ/g, "c")
        .replace(/kyhuyen\.com/gi, "")
        .replace(/kyhuyencom/gi, "")
        .replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>")
        .trim();

    if (!cleanText(contentEl.text())) {
        return Response.error("Nội dung chương trống: " + chapUrl);
    }
    return Response.success(htmlContent);
}
