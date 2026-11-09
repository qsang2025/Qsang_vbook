// detail.js — thong tin chi tiet mot truyen cua 思兔閱讀 (sto9.com).
// Selector that theo khao sat 2026-11-07 (HTML SSR thuan, UTF-8):
//   UU TIEN meta OG: og:novel:book_name, og:novel:author,
//   og:novel:category, og:novel:status (連載 = dang ra / 全本 = da xong),
//   og:novel:latest_chapter_name, og:novel:latest_chapter_url,
//   og:novel:update_time, og:book_id, og:image (cover).
//   Fallback DOM: h1 trong .booknav2 (ten), .bookbox .bookimg2 img
//   (cover; truyen chua co cover dung /modules/article/images/nocover.jpg),
//   .booknav2 p (作者/分類/狀態/字數/更新), div.navtxt (mo ta — cat
//   duoi "小說關鍵詞：…" o cuoi), the loai lay tu link /novels/class/
//   trong .booknav2 p (doi chieu voi OG category khi test — biquge tung
//   gap OG gan sai the loai).
// Vi du: /book/671.html 夜無疆, tac gia 辰東, 連載, 521.47萬字,
// cap nhat 2026-11-07, chuong moi nhat 第870章 夜州不是你想來就能來,
// "873 章節數". Truyen hoan mau: /book/533.html 天才俱樂部 (全本).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function ogContent(doc, prop) {
    var el = doc.select('meta[property="' + prop + '"]').first();
    if (el === null) return "";
    return cleanText(el.attr("content"));
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = ogContent(doc, "og:novel:book_name");
    if (!name) {
        var h1 = doc.select(".booknav2 h1").first();
        if (h1 === null) h1 = doc.select("h1").first();
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = ogContent(doc, "og:novel:author");
    if (!author) {
        var authorEl = doc.select('.booknav2 a[href*="/author/"]').first();
        if (authorEl !== null) author = cleanText(authorEl.text());
    }

    var cover = ogContent(doc, "og:image");
    if (cover && cover.indexOf("nocover") !== -1) cover = "";
    if (cover) cover = absUrl(cover);
    if (!cover) {
        var img = doc.select(".bookbox .bookimg2 img").first();
        if (img === null) img = doc.select(".bookimg2 img").first();
        cover = coverFromImg(img);
    }

    var description = cleanText(doc.select("div.navtxt").text());
    var kwPos = description.indexOf("小說關鍵詞：");
    if (kwPos !== -1) description = description.substring(0, kwPos).replace(/\s+$/g, "");
    if (!description) description = ogContent(doc, "og:description");

    var statusText = ogContent(doc, "og:novel:status");
    var navText = cleanText(doc.select(".booknav2").text());
    if (!statusText) {
        var sm = navText.match(/狀態：\s*(\S+)/);
        if (sm) statusText = sm[1];
    }
    var ongoing = statusText.indexOf("全本") === -1 && statusText.indexOf("完本") === -1 && statusText.indexOf("完結") === -1;

    var wordCount = "";
    var wm = navText.match(/字數：\s*(\S+)/);
    if (wm) wordCount = wm[1];

    var updateTime = ogContent(doc, "og:novel:update_time");
    if (!updateTime) {
        var um = navText.match(/更新：\s*(\S+)/);
        if (um) updateTime = um[1];
    }

    var latestName = ogContent(doc, "og:novel:latest_chapter_name");

    var genreText = "";
    var genreId = "";
    var catLink = doc.select('.booknav2 a[href*="/novels/class/"]').first();
    if (catLink !== null) {
        genreText = cleanText(catLink.text());
        genreId = genreIdByName(genreText);
        if (!genreId) {
            var cm = String(catLink.attr("href")).match(/\/class\/(\d+)_/);
            if (cm) genreId = cm[1];
        }
    }
    if (!genreId) {
        genreText = ogContent(doc, "og:novel:category");
        genreId = genreIdByName(genreText);
    }
    var genres = [];
    if (genreId) {
        genres.push({ title: genreText, input: "/novels/class/" + genreId + "_1.html", script: "book.js" });
    }

    var detailHtml = "";
    if (author) detailHtml += "作者：" + author + "<br>";
    if (statusText) detailHtml += "状态：" + (ongoing ? "连载" : "完本") + "<br>";
    if (wordCount) detailHtml += "字数：" + wordCount + "<br>";
    if (genreText) detailHtml += "分类：" + genreText + "<br>";
    if (updateTime) detailHtml += "更新：" + updateTime + "<br>";
    if (latestName) detailHtml += "最新章节：" + latestName;

    return Response.success({
        name: htmlDecode(name),
        author: author,
        cover: cover,
        description: description,
        detail: detailHtml,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
