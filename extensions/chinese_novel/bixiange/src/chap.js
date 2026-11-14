// chap.js — Noi dung chuong (execute(url) -> HTML + tieu de chuong).
//
// Trang chuong /{cat}/{id}/index/{n}.html (kiem chung live 2026-11-14):
// - Noi dung o #mycontent (98-99 doan/chuong o truyen mau).
// - Chuong 1 chua khoi intro (ten truyen + tac gia + 简介) truoc marker
//   "正文卷" — cat bo phan truoc marker.
// - Tieu de chuong that ("第一章 ...") nam trong noi dung — lay lam data2.
// - Chuong dai tach trang con _{p}.html (gop toi da 5 trang).
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

var CHAP_CSS = "#mycontent, #BookText, .booktext, #nr, .nr, .content, #content, #chaptercontent, .chapter-content";
var PROMO_LINE_RE = /本书由|提供下载|最新章节|手机用户|一秒钟记住|请记住|本站网址|章节错误|内容更新|本章字数|正文字数|分享本书|点击右上角|阅读全文|www\.|\.net|\.com|\.me|bixiange|笔仙阁|全文免费|免费阅读|作者有话|下载地址|最新站点/i;
var CHAP_TITLE_RE = /^第\s*\d+\s*[章節节]/;

function cleanParas(doc) {
    var el = safeFirst(doc.select(CHAP_CSS));
    if (!el) return { paras: [], title: "" };
    el.select("script, style, ins, iframe, .advert, .advertisement, .chapter-footer, .chapter-header, .readBtn, .bottem, .bottom, .top, .chapter-nav, .read-nav").remove();
    el.select("a").remove();
    var raw = [];
    var ps = el.select("p");
    var i = 0;
    if (ps.size() > 2) {
        for (i = 0; i < ps.size(); i++) {
            raw.push(cleanText(ps.get(i).text()).replace(/^\u3000+/, ""));
        }
    } else {
        var txt = stripHtml(el.html());
        raw = txt.split("\n");
    }
    // Cat khoi intro o chuong 1: bo moi doan truoc marker "正文卷".
    var start = 0;
    for (i = 0; i < raw.length; i++) {
        if (cleanText(raw[i]) === "正文卷") { start = i + 1; break; }
    }
    var paras = [];
    var title = "";
    for (i = start; i < raw.length; i++) {
        var t = cleanText(raw[i]).replace(/^\u3000+/, "");
        if (!t || PROMO_LINE_RE.test(t)) continue;
        if (!title && CHAP_TITLE_RE.test(t)) title = t;
        paras.push(t);
    }
    return { paras: paras, title: title };
}

function parasToHtml(paras) {
    var parts = [];
    for (var i = 0; i < paras.length; i++) {
        parts.push("<p>\u3000\u3000" + paras[i] + "</p>");
    }
    return parts.join("\n");
}

function detectChapPages(doc, chapPath) {
    var maxPage = 1;
    var links = doc.select("a[href*='" + chapPath + "_']");
    for (var i = 0; i < links.size(); i++) {
        var href = String(links.get(i).attr("href") || "");
        var match = /_(\d+)\.html/.exec(href);
        if (match) {
            var pageNum = parseInt(match[1], 10);
            if (pageNum > maxPage) maxPage = pageNum;
        }
    }
    return maxPage;
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var chapPath = chapUrl.replace(BASE_URL, "").replace(/\.html$/, "").replace(/_\d+$/, "");

    var r = fetchBxDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var found = cleanParas(r.doc);
    var paras = found.paras;
    var title = found.title;

    var maxPage = detectChapPages(r.doc, chapPath);
    for (var p = 2; p <= maxPage && p <= 5; p++) {
        var pageUrl = BASE_URL + chapPath + "_" + p + ".html";
        var pr = fetchBxDoc(pageUrl);
        if (pr.error) break;
        var pageFound = cleanParas(pr.doc);
        if (pageFound.paras.length === 0) break;
        paras = paras.concat(pageFound.paras);
    }

    if (paras.length === 0) return Response.error("Không tìm thấy nội dung chương.");
    var html = parasToHtml(paras);
    if (html.length < 50) return Response.error("Không tìm thấy nội dung chương.");
    return Response.success(html, title);
}
