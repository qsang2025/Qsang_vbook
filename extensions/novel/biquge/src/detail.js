// detail.js — thong tin chi tiet mot truyen cua 笔趣阁 (biquge.tw).
// Selector that theo khao sat 2026-11-06 (HTML SSR thuan, UTF-8):
//   h1 a ten truyen; h2: a[href*="/author/"] tac gia + span 字数/状态/更新
//   cover: img[src*="img.biquge.tw"] (anh that, khong phai placeholder)
//   mo ta: div.intro (bo tien to "小说简介：")
//   the loai: link /sort/ trong breadcrumb .navigator (text co duoi 小说,
//     vd 历史军事小说) — du phong meta og:novel:category
//   trang thai: og:novel:status (连载 / 全本); chuong moi nhat:
//   og:novel:lastest_chapter_name
// LUU Y: og:novel:category cua site doi khi sai (vd ban 凡人修仙传
// id 199376 bi gan 女生耽美) — breadcrumb va OG cung mot gia tri nen
// khong sua duoc tu phia extension; ghi chu trong README.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) {
        var chRes = fetchWithChallengeHandler(url, { siteName: "笔趣阁" });
        if (chRes && chRes.ok) {
            if (chRes.doc) doc = chRes.doc;
            else if (chRes.html) doc = Html.parse(chRes.html);
        } else if (chRes && chRes.error) {
            return Response.error(chRes.error);
        }
    }
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    // N2 (v4): trang loi cua site tra HTTP 200, tieu de "出错了" — truyen
    // khong ton tai (vd /book/99999999.html). Kiem chung bang curl 2026-11-09.
    if (isErrorPage(doc)) return Response.error("Truyện không tồn tại (link có thể đã đổi): " + url);

    var name = cleanText(doc.select("h1").text());
    if (!name) {
        var ogTitle = doc.select('meta[property="og:title"]').first();
        if (ogTitle !== null) name = cleanText(ogTitle.attr("content"));
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = "";
    var authorEl = doc.select('h2 a[href*="/author/"]').first();
    if (authorEl !== null) author = cleanText(authorEl.text());
    if (!author) {
        var ogAuthor = doc.select('meta[property="og:novel:author"]').first();
        if (ogAuthor !== null) author = cleanText(ogAuthor.attr("content"));
    }

    var cover = "";
    var img = doc.select('img[src*="img.biquge.tw"]').first();
    if (img !== null) cover = absUrl(img.attr("src"));
    if (!cover) {
        var ogImg = doc.select('meta[property="og:image"]').first();
        if (ogImg !== null) cover = absUrl(ogImg.attr("content"));
    }

    var description = cleanText(doc.select(".intro").text());
    description = description.replace(/^小说简介：/, "");

    var h2Text = cleanText(doc.select("h2").text());
    var statusText = "";
    var sm = h2Text.match(/状态：\s*(\S+)/);
    if (sm) statusText = sm[1];
    if (!statusText) {
        var ogStatus = doc.select('meta[property="og:novel:status"]').first();
        if (ogStatus !== null) statusText = cleanText(ogStatus.attr("content"));
    }
    var ongoing = statusText.indexOf("全本") === -1 && statusText.indexOf("完本") === -1 && statusText.indexOf("完结") === -1;

    var wordCount = "";
    var wm = h2Text.match(/字数：\s*(\S+)/);
    if (wm) wordCount = wm[1];

    var genreText = "";
    var genreSlug = "";
    var navLinks = doc.select('.navigator a[href*="/sort/"]');
    var ni = 0;
    for (ni = 0; ni < navLinks.size(); ni++) {
        var t = cleanText(navLinks.get(ni).text());
        var href = navLinks.get(ni).attr("href");
        if (t && href && href !== "/sort/") {
            genreText = t.replace(/小说$/, "");
            genreSlug = genreSlugByName(genreText);
        }
    }
    if (!genreSlug) {
        var ogCat = doc.select('meta[property="og:novel:category"]').first();
        if (ogCat !== null) {
            genreText = cleanText(ogCat.attr("content"));
            genreSlug = genreSlugByName(genreText);
        }
    }
    var genres = [];
    if (genreSlug) {
        genres.push({ title: genreText, input: "/sort/" + genreSlug + "/", script: "book.js" });
    }

    var latestName = "";
    var ogLatest = doc.select('meta[property="og:novel:lastest_chapter_name"]').first();
    if (ogLatest !== null) latestName = cleanText(ogLatest.attr("content"));

    var detailHtml = "";
    if (author) detailHtml += "作者：" + author + "<br>";
    if (statusText) detailHtml += "状态：" + (ongoing ? "连载" : "完本") + "<br>";
    if (wordCount) detailHtml += "字数：" + wordCount + "<br>";
    if (genreText) detailHtml += "分类：" + genreText + "<br>";
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
