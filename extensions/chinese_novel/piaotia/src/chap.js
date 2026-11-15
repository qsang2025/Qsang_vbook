// chap.js — doc noi dung mot chuong (piaotia.com).
//
// Layout that (kiem chung live 2026-11-15, ch.1 + ch.2 傲世九重天):
// - Chuong la text tran truc tiep duoi <body>: khong co #content, khong
//   co <p>. Van ban bat dau bang dong tieu de chuong + "(《》)" va ket
//   thuc ngay truoc <div class="bottomlink">. Lay body html roi cat tu
//   tieu de chuong den bottomlink, sau do lam sach bang cleanHtml.
// - Neu site doi giao dien co #content thi dung #content truoc.
// - Tieu de chuong lay tu <title> (parseChapterTitle).
// - Chia trang: chuong hien tai khong chia trang (khong co link "下一页");
//   van giu vong lap phong thu: neu bottomlink/toplink co link chu
//   "下一页" thi tai them trang ke (toi da 5 trang) roi noi vao.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function extractChapterHtml(doc, title) {
    // Duong chinh moi: #content neu site co (phong thu doi giao dien).
    var contentEl = safeFirst(doc.select("#content"));
    if (contentEl !== null) {
        var h = contentEl.html();
        if (h && cleanText(contentEl.text()).length > 100) return h;
    }
    var bodyEl = safeFirst(doc.select("body"));
    if (bodyEl === null) return "";
    var bodyHtml = bodyEl.html();
    if (!bodyHtml) return "";
    var end = bodyHtml.indexOf('<div class="bottomlink"');
    if (end === -1) end = bodyHtml.indexOf("<!-- 翻页上AD");
    if (end === -1) end = bodyHtml.indexOf('<div id="Commenddiv"');
    if (end === -1) end = bodyHtml.length;
    var start = -1;
    if (title) start = bodyHtml.indexOf(title);
    if (start === -1 || start > end) {
        // Fallback: bat dau ngay sau the </table> cuoi cung truoc bottomlink
        // (bang quang cao tren dau chuong), bo <br>/&nbsp; thua o dau.
        var lastTable = bodyHtml.lastIndexOf("</table>", end);
        if (lastTable === -1) return "";
        start = lastTable + "</table>".length;
    }
    return bodyHtml.substring(start, end);
}

function execute(url) {
    url = String(url || "");
    if (url.charAt(0) === "/") url = siteOrigin() + url;
    url = normalizeUrl(url);
    var r = fetchPtDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = parseChapterTitle(doc);
    var html = extractChapterHtml(doc, title);
    if (!html) return Response.error("Không đọc được nội dung chương: " + url);

    // Chia trang phong thu: link "下一页" trong toplink/bottomlink.
    var currentUrl = url;
    var pages = 0;
    while (pages < 5) {
        var nextHref = "";
        var navs = doc.select("div.toplink a, div.bottomlink a");
        var i = 0;
        for (i = 0; i < navs.size(); i++) {
            var a = navs.get(i);
            if (cleanText(a.text()) === "下一页") {
                nextHref = a.attr("href");
                break;
            }
        }
        if (!nextHref) break;
        var nextUrl = resolvePtUrl(currentUrl, nextHref);
        if (nextUrl === currentUrl) break;
        var r2 = fetchPtDoc(nextUrl);
        if (r2.error) break;
        var more = extractChapterHtml(r2.doc, "");
        if (!more) break;
        html += "<br>" + more;
        currentUrl = nextUrl;
        doc = r2.doc;
        pages++;
    }

    var text = cleanHtml(html);
    text = text.replace(/\(《》\)/g, "");
    if (cleanText(text.replace(/<[^>]+>/g, "")).length < 50) {
        return Response.error("Nội dung chương quá ngắn, có thể chưa tải đủ: " + url);
    }
    if (!title) {
        // Tieu de du phong: dong dau tien cua noi dung.
        var plain = text.replace(/<[^>]+>/g, " ");
        title = cleanText(plain.split("\n")[0]).substring(0, 60);
    }
    return Response.success(text, title);
}
