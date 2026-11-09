// detail.js — thong tin chi tiet mot truyen cua 书海阁 (shuhaige.tw).
// Selector that theo khao sat 2026-11-07 (HTML SSR thuan, UTF-8):
//   UU TIEN meta OG: og:novel:book_name, og:novel:author,
//   og:novel:category (co hau to, vd 都市生活 — chuan hoa truoc khi tra
//   slug), og:novel:status (连载中 = dang ra / 已完结 = da xong),
//   og:novel:latest_chapter_name, og:novel:latest_chapter_url,
//   og:novel:update_time, og:image (cover, host tupianxs.com).
//   Fallback DOM: #bookinfo .booktitle > h1 (ten),
//   #bookinfo span#author > a (tac gia), #bookinfo #bookimg > img
//   (cover 170x228), #bookinfo .count li > span (thu tu co dinh:
//   状态 / 字数 / 点击 / 推荐 / 收藏 — 3 so sau luon = 0, KHONG dung),
//   #bookinfo #bookintro > p — BO <p> DAU TIEN (DMCA do, text "如果此书
//   侵犯了您的权益…"), tu <p> thu 2 moi la mo ta that,
//   #bookinfo .new > span.keywords > a (chuong moi nhat),
//   breadcrumb the loai div#main > div#infomain > div.tabstit >
//   a[href="/<slug>/"]. KHONG co tong so chuong tren detail.
// Vi du: /649.html 《大道主》飘荡的云 已完结 1086万字;
// /282.html 《剑动九天》孤单地飞 已完结 362万字;
// /225310.html 连载中.
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
        var h1 = doc.select("#bookinfo .booktitle h1").first();
        if (h1 === null) h1 = doc.select("h1").first();
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = ogContent(doc, "og:novel:author");
    if (!author) {
        var authorEl = doc.select("#bookinfo span#author a").first();
        if (authorEl !== null) author = cleanText(authorEl.text());
    }

    var cover = ogContent(doc, "og:image");
    if (cover && cover.indexOf("nocover") !== -1) cover = "";
    if (cover) cover = absUrl(cover);
    if (!cover) {
        var img = doc.select("#bookinfo #bookimg img").first();
        cover = coverFromImg(img);
    }

    // Mo ta: bo <p> DMCA dau tien trong #bookintro, ghep cac <p> con lai.
    var description = "";
    var introPs = doc.select("#bookinfo #bookintro p");
    var i = 0;
    for (i = 0; i < introPs.size(); i++) {
        var pText = cleanText(introPs.get(i).text());
        if (!pText) continue;
        if (pText.indexOf("如果此书侵犯了您的权益") !== -1) continue;
        description += (description ? "\n" : "") + pText;
    }
    if (!description) description = ogContent(doc, "og:description");

    var statusText = ogContent(doc, "og:novel:status");
    var countSpans = doc.select("#bookinfo .count li span");
    if (!statusText && countSpans.size() > 0) {
        statusText = cleanText(countSpans.get(0).text());
    }
    var ongoing = statusText.indexOf("全本") === -1 && statusText.indexOf("完本") === -1 &&
        statusText.indexOf("完结") === -1 && statusText.indexOf("完結") === -1;

    var wordCount = "";
    if (countSpans.size() > 1) wordCount = cleanText(countSpans.get(1).text());

    var updateTime = ogContent(doc, "og:novel:update_time");
    if (!updateTime) {
        var uptime = doc.select("#bookinfo .new span.uptime").first();
        if (uptime !== null) {
            updateTime = cleanText(uptime.text()).replace("最后更新：", "");
        }
    }

    var latestName = ogContent(doc, "og:novel:latest_chapter_name");
    if (!latestName) {
        var latestEl = doc.select("#bookinfo .new span.keywords a").first();
        if (latestEl !== null) latestName = cleanText(latestEl.text());
    }

    var genreText = "";
    var genreSlug = "";
    if (true) {
        // Breadcrumb: [trang chu] [the loai] [ten truyen] — link the loai
        // la link thu 2 tro ve /<slug>/, khong phai link trang chu "/".
        var catLinks = doc.select("div.tabstit a");
        var j = 0;
        for (j = 0; j < catLinks.size(); j++) {
            var h = String(catLinks.get(j).attr("href"));
            if (h !== "/" && h !== "https://www.shuhaige.tw" && h.charAt(h.length - 1) === "/") {
                genreText = cleanText(catLinks.get(j).text());
                genreSlug = genreSlugByName(genreText);
                if (!genreSlug) {
                    var sm = h.match(/^\/([a-z]+)\/$/);
                    if (sm) genreSlug = sm[1];
                }
                break;
            }
        }
    }
    if (!genreSlug) {
        genreText = ogContent(doc, "og:novel:category");
        genreSlug = genreSlugByName(genreText);
    }
    var genres = [];
    if (genreSlug) {
        genres.push({ title: genreText, input: "/" + genreSlug + "/", script: "book.js" });
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
