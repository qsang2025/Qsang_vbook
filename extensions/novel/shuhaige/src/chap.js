// chap.js — doc noi dung mot chuong cua 书海阁 (shuhaige.tw).
//
// DAC THU CUA SITE (khao sat 2026-11-07, da kiem chung tren chuong that):
// - Tieu de: div.bookname > h1 dang "第3094章 见识  1/5" — strip phan
//   "  N/M" khi lay ten chuong.
// - Noi dung: div#content, cac doan la <p> (khong <br>).
// - CHUONG CHIA NHIEU TRANG CON: dieu huong div.bottem1:
//   a.pre#pager_prev (上一章; o trang con k>1 la 上一页),
//   a.back#pager_current (章节列表 -> /{id}/),
//   a.next#pager_next — TEXT QUYET DINH: "下一页" -> trang con tiep
//   /{id}/{cid}_{k+1}.html (vd _2.html…_5.html; _1 khong ton tai, trang
//   dau la .html goc); "下一章" -> href /{id}/end.html la SENTINEL GIA —
//   DUNG, KHONG fetch no. chap.js loop toi da 10 trang con, noi du noi dung.
// - Loc rac trong #content theo NOI DUNG (khong theo so luong co dinh):
//   bo <p> dau tien (DMCA "如果此书侵犯了您的权益…") va cac dong cuoi:
//   "小主子，这个章节后面还有哦 ^.^，请点击下一页继续阅读，后面更精彩！",
//   "本小章还未完~.~，请点击下一页继续阅读后面精彩内容！",
//   "无错的章节将持续在" (cau "《{书名}》无错的章节将持续在书海阁小说网
//   小说网更新,站内无任何广告,还请大家收藏和推荐书海阁小说网！"),
//   "请大家收藏：(shuhaige.tw)".
// Vi du: ch.3094 《大道主》 5 trang con (p1 ~3.580 ky tu), ch.1 3 trang
// con, ch.1 《剑动九天》 2 trang con.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function chapterTitle(doc) {
    var title = "";
    if (doc !== null) {
        var h1 = doc.select("div.bookname h1").first();
        if (h1 === null) h1 = doc.select("h1").first();
        if (h1 !== null) title = cleanText(h1.text());
    }
    // Strip hau to "  N/M" (vd "第3094章 见识  1/5" -> "第3094章 见识").
    title = title.replace(/\s+\d+\s*\/\s*\d+\s*$/, "");
    return title;
}

function isJunkParagraph(text) {
    if (!text) return true;
    if (text.indexOf("如果此书侵犯了您的权益") !== -1) return true;
    if (text.indexOf("小主子，这个章节后面还有哦") !== -1) return true;
    if (text.indexOf("本小章还未完") !== -1) return true;
    if (text.indexOf("无错的章节将持续在") !== -1) return true;
    if (text.indexOf("请大家收藏：(shuhaige.tw)") !== -1) return true;
    return false;
}

function contentHtml(doc) {
    var box = doc.select("div#content").first();
    if (box === null) return "";
    var html = "";
    var ps = box.select("p");
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var p = ps.get(i);
        var text = cleanText(p.text());
        if (isJunkParagraph(text)) continue;
        html += "<p>" + p.html() + "</p>";
    }
    if (!html) {
        // Du phong: lay toan bo #content, bo cac doan rac theo noi dung.
        var raw = box.html();
        var parts = raw.split(/<\/p>/i);
        var kept = [];
        var j = 0;
        for (j = 0; j < parts.length; j++) {
            var seg = parts[j];
            var plain = seg.replace(/<[^>]*>/g, "");
            if (isJunkParagraph(cleanText(plain))) continue;
            if (cleanText(plain)) kept.push(seg + "</p>");
        }
        html = kept.join("");
    }
    return html;
}

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/(\d+)\/(\d+)(?:_(\d+))?\.html$/);
    if (!m) return Response.error("Không đọc được ID chương từ URL: " + url);
    var bookId = m[1];
    var chapId = m[2];

    var title = "";
    var fullHtml = "";
    var pageUrl = BASE_URL + "/" + bookId + "/" + chapId + ".html";
    var k = 0;
    for (k = 1; k <= 10; k++) {
        var doc = fetchDocWithFallback(pageUrl);
        if (!doc) {
            if (k === 1) return Response.error("Không tải được chương: " + url);
            break;
        }
        if (k === 1) title = chapterTitle(doc);
        var part = contentHtml(doc);
        if (part) fullHtml += part;
        // Dieu huong trang con: chi theo "下一页", dung o "下一章".
        var nextEl = doc.select("a#pager_next").first();
        if (nextEl === null) nextEl = doc.select("a.next").first();
        if (nextEl === null) break;
        var nextText = cleanText(nextEl.text());
        var nextHref = nextEl.attr("href") || "";
        if (nextText.indexOf("下一页") === -1) break;
        if (nextHref.indexOf("end.html") !== -1) break;
        var nm = nextHref.match(/\/(\d+)\/(\d+)_(\d+)\.html$/);
        if (!nm) break;
        pageUrl = absUrl(nextHref);
    }

    if (!fullHtml) return Response.error("Không đọc được nội dung chương: " + url);
    var plain = fullHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;|&emsp;/g, "").replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương: " + url);

    return Response.success(fullHtml, title);
}
