// detail.js — thong tin chi tiet mot gallery / manga series cua NiACG.
//
// Hai dang URL chi tiet (xem helper.js):
//   moehome-<class>-<id>.html — gallery don (1 bo anh) hoac 1 chuong manga.
//     Ten: h1.book-name#book-name; ngay dang: "上架日期 : YYYY-MM-DD";
//     tag: meta keywords (cach nhau bang dau phay) + link /tags-...;
//     anh bia: img[itemprop="image"] dau tien (anh xem truoc).
//   showinfo-<class>-<id>-0.html — series manga (class 14/15: danh sach
//     chuong) hoac trang info cua 1 gallery. Khong co h1: ten lay tu
//     <title>; anh bia series lay tu anh noi dung comic.xunge.cyou dau
//     tien tren trang; mo ta tu meta description (co the rong).
// Mo ta: meta description. Tac gia: nhan "作者" tren trang (neu co).
// Genres: tag -> book.js voi /tags-<tag>-0.html.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Mo ta day du tu #intro-block (div 敘述/叙述), roi moi fallback ve meta
// description. Vi du: moehome-1-162877 cho "Tiny Asa アサ - Fleurdelys
// (Wuthering Waves)" (meta description chi co ten ngan hon); showinfo
// -14-209 thi div 敘述 trong nen mo ta rong -> fallback meta (cung rong).
function introDescription(doc) {
    var el = doc.select("#intro-block div.p-t-5.p-b-5").first();
    if (el === null) return "";
    var text = cleanText(el.text());
    text = text.replace(/^(敘述|叙述|简介|簡介)[:：]?\s*/, "");
    return cleanText(text);
}

// Meta content theo ten (description / keywords).
function metaContent(doc, name) {
    var el = doc.select("meta[name=\"" + name + "\"]").first();
    if (el === null) return "";
    return cleanText(el.attr("content") || "");
}

// Anh bia: anh noi dung dau tien (uu tien data-src, bo placeholder/quang cao).
function firstContentImage(doc) {
    var imgs = doc.select("img");
    var i = 0;
    for (i = 0; i < imgs.size(); i++) {
        var el = imgs.get(i);
        var src = el.attr("data-src") || el.attr("src") || "";
        if (!src) continue;
        if (src.indexOf("imgloading") !== -1) continue;
        if (src.indexOf("/skin/") !== -1) continue;
        if (src.indexOf("cat.zhen.si") !== -1) continue;
        if (src.indexOf("chmsrv.com") !== -1 || src.indexOf("realsrv.com") !== -1) continue;
        if (src.indexOf("xunge.cyou") === -1) continue;
        if (src.indexOf("/min/slt/") !== -1) continue;
        if (src.indexOf("/media/categories/") !== -1) continue;
        return absImageUrl(src);
    }
    return "";
}

// Tag tu meta keywords (cach nhau bang dau phay) + link /tags- tren trang.
function collectTags(doc) {
    var tags = [];
    var seen = {};
    var kw = metaContent(doc, "keywords");
    if (kw) {
        var parts = kw.split(",");
        var i = 0;
        for (i = 0; i < parts.length; i++) {
            var t = cleanText(parts[i]);
            if (t && !seen[t]) {
                seen[t] = true;
                tags.push(t);
            }
        }
    }
    doc.select("a[href^=\"/tags-\"]").forEach(function (el) {
        var t = cleanText(el.text());
        if (t && !seen[t]) {
            seen[t] = true;
            tags.push(t);
        }
    });
    return tags;
}

function execute(url) {
    url = normalizeUrl(url);
    var classid = classIdOf(url);
    var id = itemIdOf(url);
    if (!classid || !id) return Response.error("Không đọc được mục/id từ URL: " + url);

    var doc = fetchDocWithFallback(url);
    if (!doc) return Response.error("Không tải được trang chi tiết: " + url);

    var isMoehome = url.indexOf("/moehome-") !== -1;
    var name = "";
    if (isMoehome) {
        var h1 = doc.select("h1.book-name").first();
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) {
        var title = "";
        try { title = cleanText(doc.select("title").text()); } catch (e) {}
        // <title> cua trang series co hau to " 日漫" — giu nguyen (do la
        // ten muc, khong phai phan cua ten truyen; cat bo neu co).
        name = title.replace(/\s+(日漫|韩漫|COS|CG|本子|套图|画廊|最新|漫画)\s*$/, "");
    }
    if (!name) return Response.error("Không đọc được tên tác phẩm: " + url);

    var cover = firstContentImage(doc);

    var description = introDescription(doc);
    if (!description) description = metaContent(doc, "description");

    var dateText = "";
    var bodyText = "";
    try { bodyText = String(doc.select("body").text()); } catch (e) {}
    var dm = bodyText.match(/上架日期\s*:\s*(\d{4}-\d{2}-\d{2})/);
    if (dm) dateText = dm[1];

    // Trang thai ongoing that: quet chuoi 完结/完結/最终话/最終話 (da xong)
    // va 连载/連載 (dang ra). Mac dinh false khi khong thay dau hieu nao
    // (them 2026-11-07, theo cach cua ban Antigravity; truoc day hardcode
    // false). Luu y: 2 trang mau (moehome-1-162877, showinfo-14-209) deu
    // khong co cac chuoi nay nen deu tra false.
    var ongoing = false;
    var statusText = "";
    if (bodyText.indexOf("完结") !== -1 || bodyText.indexOf("完結") !== -1 ||
        bodyText.indexOf("最终话") !== -1 || bodyText.indexOf("最終話") !== -1) {
        ongoing = false;
        statusText = "Đã hoàn thành";
    } else if (bodyText.indexOf("连载") !== -1 || bodyText.indexOf("連載") !== -1) {
        ongoing = true;
        statusText = "Đang ra";
    }

    var author = "";
    var am = bodyText.match(/作者\s*[:：]\s*([^\s]+)/);
    if (am) author = cleanText(am[1]);

    var tags = collectTags(doc);
    var genres = [];
    var gi = 0;
    for (gi = 0; gi < tags.length; gi++) {
        var tagUrl = "/tags-" + encodeURIComponent(tags[gi]).replace(/%20/g, "+") + "-0.html";
        genres.push({ title: tags[gi], input: tagUrl, script: "book.js" });
    }

    var detailHtml = "";
    detailHtml += "Mục: " + className(classid);
    if (dateText) detailHtml += "<br>Ngày đăng: " + dateText;
    if (author) detailHtml += "<br>Tác giả: " + author;
    if (statusText) detailHtml += "<br>Trạng thái: " + statusText;
    if (isSeriesUrl(url)) detailHtml += "<br>Dạng: Series nhiều chương";

    // Goi y: cac item anh khac tren trang (moehome/showinfo muc anh).
    var suggests = [];
    var seenSug = {};
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        var link = absUrl(href);
        if (link === url || seenSug[link]) return;
        var cid = classIdOf(link);
        if (link.indexOf("/moehome-") === -1 && link.indexOf("/showinfo-") === -1) return;
        if (IMAGE_CLASSES.indexOf(cid) === -1) return;
        var t = cleanText(el.attr("title") || "") || cleanText(el.text());
        if (!t) return;
        seenSug[link] = true;
        suggests.push({ title: t, input: link, script: "detail.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailHtml,
        url: url,
        type: "comic",
        format: "comic",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests.slice(0, 10)
    });
}
