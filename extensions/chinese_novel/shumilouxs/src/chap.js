// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /<id>/<chapid>.html (kiem chung live 2026-11-16 voi
// 欢迎进入梦魇直播间 ch.1 /104461/35845736.html va ch.2):
// - Noi dung trong #booktxt (cac <p>); chuong 1 KHONG co khoi dau trang
//   (bat dau thang vao truyen) nen khong can cat.
// - Chuong chia nhieu trang: link a[rel="next"] toi _2.html, _3.html...
//   (ch.1 co 2 trang, tong ~4.600 ky tu). Trang CUOI cua chuong co
//   a[rel="next"] tro toi chuong KE TIEP, nen vong lap chi tiep tuc khi
//   URL ke van chua phan goc cua chuong hien tai (bo hau to _N).
// - Dong mau can cat: "本章未完，点击下一页继续阅读。" (cuoi trang chia)
//   va "最近转码严重，让我们更有动力，更新更快，麻烦你动动小手退出阅读模式。谢谢"
//   (quang cao transcode o cuoi chuong).
// - Tieu de chuong: phan truoc dau "_" dau tien trong <title>.
// - Khong co khoa VIP / dang nhap / preview.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var chapUrl = String(url || "");
    if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
    chapUrl = normalizeUrl(chapUrl);
    // Phan goc cua chuong: bo ".html" va hau to trang chia "_N".
    var base = chapUrl.replace(/(_\d+)?\.html$/i, "");
    var next = chapUrl;
    var parts = [];
    var title = "";
    var hops = 0;
    while (next && hops < 10) {
        hops++;
        var r = fetchSkDoc(next);
        if (r.error) {
            if (parts.length > 0) break;
            return Response.error(r.error);
        }
        var doc = r.doc;
        if (!title) {
            var t = cleanText(doc.select("title").text());
            var cut = t.indexOf("_");
            title = cut > 0 ? t.substring(0, cut) : t;
        }
        var contentEl = safeFirst(doc.select("#booktxt"));
        if (contentEl === null) {
            if (parts.length > 0) break;
            return Response.error("Không đọc được nội dung chương: " + next);
        }
        contentEl.select("a").remove();
        var ps = contentEl.select("p");
        var i = 0;
        for (i = 0; i < ps.size(); i++) {
            var t2 = cleanText(ps.get(i).text());
            if (!t2) continue;
            if (t2.indexOf("本章未完，点击下一页继续阅读") !== -1) continue;
            if (t2.indexOf("最近转码严重") !== -1) continue;
            parts.push("<p>" + t2 + "</p>");
        }
        var nextEl = safeFirst(doc.select("a[rel=\"next\"]"));
        var href = nextEl !== null ? nextEl.attr("href") : "";
        if (!href) break;
        var nextUrl = absUrl(href).replace(/\.html$/i, "");
        if (nextUrl.indexOf(base) !== 0) break;
        next = nextUrl + ".html";
    }
    var html = parts.join("");
    if (!html || cleanText(stripTags(html)).length < 20) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }
    return Response.success(html, title);
}
