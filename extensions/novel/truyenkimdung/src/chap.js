// chap.js — Noi dung 1 chuong truyen Truyen Kim Dung (truyenkimdung.net).
//
// Trang chuong `/truyen/<slug>/hoi-<n>-<slug-chuong>` (HTML tinh, kiem
// chung live 2026-11-19): noi dung o #reader-content (.reader-content),
// cac doan tach nhau bang <p>; tieu de chuong o .chapter-title (va
// data-chapter-title tren article.reader). Chuong doc du (~15.000 tu
// chuong mau), khong login/VIP — "Dang nhap" chi de binh luan.
// execute(url).
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

    var r = fetchTkDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("#reader-content"));
    if (contentEl === null) contentEl = safeFirst(doc.select(".reader-content"));
    if (contentEl === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);

    // Loc sach: script/style/iframe va khoi quang cao neu site chen sau nay.
    contentEl.select("noscript, style, script, iframe, ins").remove();

    var htmlContent = contentEl.html() || "";
    if (!htmlContent || !cleanText(contentEl.text())) {
        return Response.error("Nội dung chương trống: " + chapUrl);
    }
    htmlContent = htmlContent.replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>").trim();

    // Tieu de chuong tra ve qua data2 (theo extension-api): lay tu
    // .chapter-title, du phong data-chapter-title tren article.reader.
    var titleEl = safeFirst(doc.select(".chapter-title"));
    var title = titleEl ? cleanText(titleEl.text()) : "";
    if (!title) {
        var articleEl = safeFirst(doc.select("article.reader"));
        if (articleEl !== null) title = cleanText(articleEl.attr("data-chapter-title") || "");
    }
    return Response.success(htmlContent, title);
}
