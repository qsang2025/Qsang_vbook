// chap.js — noi dung mot chuong cua 乐文小说.
// URL mau: https://www.ilwxs.com/shu/41361/128018870.html
// (嫡嫁千金 第一章 芳菲 — kiem chung live 2026-11-15: 76 doan <p>
// trong #content, mo dau "五月，暮春刚过，天气便急不可待的炙热起来。").
// Ten chuong lay tu <h1> tren trang. Cuoi #content co khoi dieu huong
// div.bottem (vote / chuong truoc / muc luc / chuong sau / bookmark) —
// bo khoi nay, chi giu van chuong. Chuong khong chia trang (khong co
// "下一页" trong #content); neu site chia chuong thanh (1/2) thi can
// them xu ly phan trang sau.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    var res = fetchPage(url);
    if (!res.ok) return Response.error("Không tải được chương (HTTP " + res.status + ")");
    var doc = res.html();
    doc.select("script").remove();
    doc.select("div.bottem").remove();
    doc.select(".bottem2").remove();
    var contentEl = safeFirst(doc.select("#content"));
    if (!contentEl) return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện): " + url);
    var htm = contentEl.html();
    htm = cleanChapterHtml(htm);
    if (!htm) return Response.error("Chương trống: " + url);
    var titleEl = safeFirst(doc.select("h1"));
    var title = titleEl ? cleanText(titleEl.text()) : "";
    return Response.success(htm, title);
}

// Gom nhom <br> lien tiep, xoa comment HTML, cat khoang trang thua.
function cleanChapterHtml(htm) {
    htm = htm.replace(/(<br\s*\/?>\s*){2,}/gi, "<br>");
    htm = htm.replace(/<!--[\s\S]*?-->/g, "");
    return htm.replace(/^\s+|\s+$/g, "");
}
