// chap.js — noi dung chuong cua 和图书 (hetushu.com).
// URL chuong: /book/<id>/<so>.html (vd /book/10195/7144725.html).
// Noi dung: div#content — cac <h2> la tieu de quyen/chuong, moi doan
// van la mot <div> rieng; co mot <div class="mask mask2"></div> trong
// can bo truoc khi lay HTML. Vi moi doan la <div> nen doi </div> thanh
// <br> truoc khi cleanHtml, neu khong cac doan se dinh lien nhau
// (cleanHtml bo the div nhung giu van ban).
// Watermark chong scrape: site chen the <kbd>/<dfn>/<acronym> chua chu
// rac (vd. 和-图-书, https://m.hetushu.com.com) giua cau — cat ca the
// lan noi dung truoc khi cleanHtml (cleanHtml khong xu ly cac the nay).
// Tieu de chuong: #ctitle .title (vd "第一卷 笼中雀 第一章 惊蛰"),
// fallback tach tu <title> cua trang.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, cleanHtml.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('cleanHtml.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL chương không hợp lệ");

    rateLimitDelay("www.hetushu.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương: " + url);

    // Tieu de chuong.
    var title = cleanText(doc.select("#ctitle .title").text());
    if (!title) {
        var pageTitle = cleanText(doc.select("title").text());
        if (pageTitle) {
            var parts = pageTitle.split("_");
            if (parts.length >= 2) title = parts[1];
            else title = pageTitle;
        }
    }
    if (!title) title = url;

    var contentEl = doc.select("#content").first();
    if (contentEl === null) {
        return Response.error("Không lấy được nội dung chương: " + url);
    }

    var html = contentEl.html();
    // Bo khoi mask trong (rong, dung de chan copy).
    html = html.replace(/<div class="mask[^"]*"[^>]*><\/div>/gi, "");
    // Bo tieu de quyen/chuong <h2> trong noi dung (da tra ve lam data2).
    html = html.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "");
    // Bo the watermark chong scrape chen giua cau (khao sat 2026-11-11:
    // ch.1 co 5 the: <kbd>和-图-书</kbd>, <dfn>https://m.hetushu.com.com
    // </dfn>, <acronym>和*图*书</acronym>... — cleanHtml chi bo the
    // div/span nen chu trong cac the nay se lot vao ban doc neu khong
    // cat o day; cat ca the lan noi dung ben trong).
    html = html.replace(/<(kbd|dfn|acronym)[^>]*>[\s\S]*?<\/\1>/gi, "");
    // Moi doan van la mot <div>: doi dong </div> thanh <br> truoc khi
    // cleanHtml bo the div.
    html = html.split("</div>").join("<br>");
    var clean = cleanHtml(html);
    if (!clean) {
        return Response.error("Không lấy được nội dung chương: " + url);
    }

    return Response.success(clean, title);
}
