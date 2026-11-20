// article.js — doc mot bai VnExpress (loai news: cham bai la mo thang
// reader, khong qua trang detail). Content ghep tu lead + cac doan
// p.Normal + anh figure trong .fck_detail theo dung thu tu trang,
// bo qua khoi quang cao / bai lien quan / menu o cuoi trang.
// Bai tra phi: neu noi dung trong hoac qua ngan thi bao loi ro rang,
// khong vuot paywall (luat nha).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được bài viết: " + url);

    var name = cleanText(doc.select("h1.title_news_detail").text());
    if (!name) name = cleanText(doc.select("meta[property='og:title']").attr("content"));
    var cover = String(doc.select("meta[property='og:image']").attr("content") || "");
    var time = cleanText(doc.select("p.metadate").text());
    var lead = cleanText(doc.select("p.short_intro").text());

    var tags = [];
    var tagText = String(doc.select("meta[property='article:tag']").attr("content") || "");
    if (tagText) {
        var parts = tagText.split(",");
        for (var t = 0; t < parts.length; t++) {
            var tag = cleanText(parts[t]);
            if (tag) tags.push(tag);
        }
    }

    var blocks = doc.select(".fck_detail > p.Normal, .fck_detail > figure");
    var htmlParts = [];
    var textLen = 0;
    var lastPara = "";
    if (lead) {
        htmlParts.push("<p>" + lead + "</p>");
        textLen += lead.length;
    }
    blocks.forEach(function (el) {
        // Khong dung el.tagName(): runtime vBook khong co ham nay (loi
        // "TypeError: not a function", code 403 — giong vu toc.js 103 phai
        // bo children()/tagName()). Nhan dien figure bang img con.
        // QUAN TRONG: .first() cua runtime KHONG bao gio tra null — select
        // rong van tra ve object (da kiem chung tren may that 20/11) nen
        // KHONG dung `first() !== null` de kiem tra; dung .size() > 0.
        var imgs = el.select("img");
        if (imgs.size() > 0) {
            var img = imgs.first();
            var src = String(img.attr("src") || "");
            if (src) htmlParts.push("<p><img src=\"" + src + "\" /></p>");
            return;
        }
        var text = cleanText(el.text());
        if (!text) return;
        lastPara = text;
        textLen += text.length;
        htmlParts.push("<p>" + text + "</p>");
    });

    if (blocks.size() < 2 || textLen < 200) {
        return Response.error("Bài viết chưa tải được nội dung đầy đủ (có thể thuộc gói trả phí của VnExpress). Hãy mở bài trong trình duyệt của app để kiểm tra.");
    }

    // Doan cuoi ngan, khong co dau cham cau, thuong la ten tac gia.
    var author = "";
    if (lastPara && lastPara.length <= 50 && lastPara.indexOf(". ") === -1) {
        author = lastPara;
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        time: time,
        source_name: "VnExpress",
        tags: tags,
        content: htmlParts.join("\n"),
        content_format: "html"
    });
}
