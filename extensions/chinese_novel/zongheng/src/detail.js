// detail.js — Thong tin chi tiet mot truyen (Zongheng).
// Contract: execute(url) -> { name, author, cover, description, detail, url, type, format, ongoing, genres }.
// Site co 2 template chi tiet (kiem chung 2026-11-11):
//  a) Trang chinh (book.zongheng.com/book/{id}.html redirect sang
//     www.zongheng.com/detail/{id}, Nuxt): tieu de .book-info--title > span,
//     tac gia .author-info--name, bia .book-info--coverImage img,
//     tag .book-info--tags span, so lieu .book-info--nums, chuong moi nhat
//     .book-info--chapter a; mo ta CHI co trong payload __NUXT__
//     (description:"..." — can giai escape \uXXXX).
//  b) Nu tan huayu (huayu.zongheng.com/book/{id}.html, template cu):
//     div.book-name, div.au-name a, div.book-img.fl img,
//     .book-dec.Jbook-dec p, div.book-label a.
// Phan nhanh theo DOM that (chu khong theo URL) vi URL book.* redirect.
// Load: file rate-limit.js (pacing + retry).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

function nuxtDescription(text) {
    var m = text.match(/description:"((?:[^"\\]|\\.)*)"/);
    if (!m) return "";
    var desc = zhUnescape(m[1]);
    desc = desc.replace(/<br\s*\/?>/gi, "<br>");
    return desc;
}

function execute(url) {
    url = zhNormalizeUrl(url);
    var pf = pacedFetch(url, { headers: zhHeaders(url) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Zongheng", "zongheng.com", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được trang truyện (HTTP " + pf.status + "): " + url);
    }
    var text = "";
    try { text = pf.res.text(); } catch (e) { text = ""; }
    if (!text) return Response.error("Không tải được trang truyện: " + url);
    var doc = Html.parse(text);

    var idMatch = String(url).match(/\/(?:detail|book)\/(\d+)/);
    var bookId = idMatch ? idMatch[1] : "";

    var name = "";
    var author = "";
    var cover = "";
    var description = "";
    var detailHtml = "";
    var ongoing = true;
    var genres = [];
    var tagTexts = [];

    var titleEl = zhFirst(doc.select(".book-info--title > span"));
    if (titleEl) {
        // Template moi (trang chinh Nuxt).
        name = zhCleanText(titleEl.text());
        var authorEl = zhFirst(doc.select(".author-info--name"));
        author = authorEl ? zhCleanText(authorEl.text()) : "";
        var coverEl = zhFirst(doc.select(".book-info--coverImage img"));
        cover = coverEl ? ((coverEl.attr("src") || "") + "") : "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        doc.select(".book-info--tags span").forEach(function (el) {
            var t = zhCleanText(el.text());
            if (t) tagTexts.push(t);
        });
        var numsEl = zhFirst(doc.select(".book-info--nums"));
        var nums = numsEl ? zhCleanText(numsEl.text()) : "";
        var latestEl = zhFirst(doc.select(".book-info--chapter a"));
        var latest = latestEl ? zhCleanText(latestEl.text()) : "";
        description = nuxtDescription(text);
        detailHtml = "Tác giả: " + author + "<br>" + tagTexts.join(" • ") + (nums ? "<br>" + nums : "") + (latest ? "<br>Chương mới nhất: " + latest : "");
        var i = 0;
        for (i = 0; i < tagTexts.length; i++) {
            if (tagTexts[i] === "已完结" || tagTexts[i] === "完本") { ongoing = false; break; }
        }
        var cateEl = zhFirst(doc.select(".book-info--tags span.cateFineId"));
        if (cateEl) {
            var cate = zhCleanText(cateEl.text());
            if (cate) genres.push({ title: cate, input: cate, script: "search.js" });
        }
    } else {
        // Template cu (huayu).
        var nameEl = zhFirst(doc.select("div.book-info > div.book-name"));
        if (!nameEl) return Response.error("Không đọc được trang truyện (site có thể đã đổi giao diện): " + url);
        name = zhCleanText(nameEl.text());
        var auEl = zhFirst(doc.select("div.book-author > div.au-name > a"));
        author = auEl ? zhCleanText(auEl.text()) : "";
        var imgEl = zhFirst(doc.select("div.book-img.fl > img"));
        cover = imgEl ? ((imgEl.attr("src") || "") + "") : "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        var descEl = zhFirst(doc.select(".book-dec.Jbook-dec > p"));
        description = descEl ? (descEl.html() + "") : "";
        doc.select("div.book-info > div.book-label a").forEach(function (el) {
            var t = zhCleanText(el.text());
            if (t) tagTexts.push(t);
        });
        detailHtml = "Tác giả: " + author + "<br>" + tagTexts.join(" • ");
        var j = 0;
        for (j = 0; j < tagTexts.length; j++) {
            if (tagTexts[j].indexOf("完结") > -1 || tagTexts[j].indexOf("完本") > -1) { ongoing = false; break; }
        }
    }

    if (!name) return Response.error("Không đọc được tên truyện: " + url);
    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailHtml,
        url: url,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres
    });
}
