// chap.js — noi dung chuong cua 稷下書院 (novel543.com).
// URL chuong: /<book>/<vol>_<seq>.html (vd /0609709217/8096_1.html).
// Noi dung: div.chapter-content > div.content.py-5 > p (khao sat 2026-11-10:
// chuong 1 mau co 31 doan that).
// Chuong chia nhieu trang: tieu de h1 dang "第1章 生活不易 (1/2)" —
// trang phu: bo ".html" roi them "_<n>.html" (vd /0609709217/8096_1_2.html),
// lay them trang 2..y va noi vao. Tieu de tra ve da cat hau to "(x/y)".
// Doan rac can loc: "溫馨提示:..." (thong bao cua site), "設置",
// "繁體简体" (nut chuyen doi), doan rong. Doan dau tien gom ca tieu de
// chuong + cau mo dau — giu nguyen nhu site hien thi.
// Trong content co khoi quang cao (div.gadBlock + script) — chi lay <p>,
// nen quang cao tu loai.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function escHtml(s) {
    return String(s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
}

function isJunkParagraph(t) {
    if (!t) return true;
    if (t === "設置" || t === "繁體简体" || t === "繁體簡體") return true;
    if (t.indexOf("溫馨提示:") === 0 || t.indexOf("溫馨提示：") === 0) return true;
    return false;
}

function collectParagraphs(doc) {
    var out = [];
    doc.select("div.chapter-content div.content p").forEach(function (p) {
        var t = cleanText(p.text());
        if (isJunkParagraph(t)) return;
        out.push("<p>" + escHtml(t) + "</p>");
    });
    return out;
}

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL chương không hợp lệ");

    rateLimitDelay("www.novel543.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương: " + url);

    // Tieu de chuong tu h1 trong div.chapter-content.
    var title = cleanText(doc.select("div.chapter-content h1").text());
    if (!title) title = cleanText(doc.select("h1").text());
    if (!title) title = url;

    var paras = collectParagraphs(doc);

    // Chuong chia nhieu trang: "(x/y)" o cuoi tieu de.
    var mPages = title.match(/[（(]\s*(\d+)\s*\/\s*(\d+)\s*[）)]\s*$/);
    var total = 1;
    if (mPages) total = parseInt(mPages[2], 10);
    if (total > 1) {
        var baseNoExt = url.replace(/\.html.*$/, "");
        var n = 2;
        for (n = 2; n <= total; n++) {
            var pageUrl = baseNoExt + "_" + n + ".html";
            rateLimitDelay("www.novel543.com");
            var pdoc = fetchDocWithFallback(pageUrl, MIRROR_LIST);
            if (!pdoc) continue;
            var extra = collectParagraphs(pdoc);
            var k = 0;
            for (k = 0; k < extra.length; k++) paras.push(extra[k]);
        }
    }

    if (paras.length === 0) {
        return Response.error("Không lấy được nội dung chương: " + url);
    }

    // Cat hau to "(x/y)" khoi tieu de tra ve.
    var cleanTitle = title.replace(/[（(]\s*\d+\s*\/\s*\d+\s*[）)]\s*$/, "");
    cleanTitle = cleanTitle.replace(/^\s+|\s+$/g, "");
    if (!cleanTitle) cleanTitle = title;

    return Response.success(paras.join(""), cleanTitle);
}
