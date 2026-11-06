// detail.js — thong tin chi tiet mot truyen cua 繁體小說 (novels.com.tw).
// Selector that theo khao sat 2026-11-06 (HTML SSR thuan):
//   khoi chinh .novel_info_main: img cover, .novel_info_title > h1 ten,
//   i a[href^="/author/"] tac gia, p span x3 = the loai / so chu / trang thai
//   (span the loai co the rong tuy truyen — de trong khi khong co, khong bia)
//   .flex.to100 a chuong moi nhat (+ em.s_gray ngay), a.l_btn chuong dau
//   mo ta #info .intro (HTML long <p><p> — jsoup doc duoc)
//   tong so chuong: tab a#a_catalog span "（477章）"
// Du phong: og:novel:author / og:novel:status khi selector chinh trong.
// The loai tren trang chi tiet chi la text (khong co link) nen map ten
// ve ID /nosort/<N>/1/ qua helper.js genreIdByName() de lam genres.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var info = doc.select(".novel_info_main").first();
    if (info === null) return Response.error("Không đọc được trang truyện (site có thể đã đổi giao diện): " + url);

    var name = cleanText(info.select(".novel_info_title h1").text());
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = "";
    var authorEl = info.select('.novel_info_title i a[href^="/author/"]').first();
    if (authorEl !== null) author = cleanText(authorEl.text());
    if (!author) {
        var ogAuthor = doc.select('meta[property="og:novel:author"]').first();
        if (ogAuthor !== null) author = cleanText(ogAuthor.attr("content"));
    }

    var cover = "";
    var img = info.select("img").first();
    if (img !== null) cover = absUrl(img.attr("src"));

    // 3 span: the loai / so chu / trang thai.
    var spans = info.select(".novel_info_title p span");
    var genreText = spans.size() > 0 ? cleanText(spans.get(0).text()) : "";
    var wordCount = spans.size() > 1 ? cleanText(spans.get(1).text()) : "";
    var statusText = spans.size() > 2 ? cleanText(spans.get(2).text()) : "";
    if (!statusText) {
        var ogStatus = doc.select('meta[property="og:novel:status"]').first();
        if (ogStatus !== null) statusText = cleanText(ogStatus.attr("content"));
    }
    var ongoing = statusText.indexOf("完本") === -1 && statusText.indexOf("全本") === -1;

    // The loai: chi map khi ten map duoc ve ID hop le (gom ca 11/12/13
    // the loai nguoi lon — giu lai theo yeu cau cua nguoi dung).
    var genres = [];
    if (genreText) {
        var gid = genreIdByName(genreText);
        if (gid > 0) {
            genres.push({ title: genreText, input: BASE_URL + "/nosort/" + gid + "/1/", script: "book.js" });
        }
    }

    var description = cleanText(doc.select("#info .intro").text());

    // Chuong moi nhat + tong so chuong (phuc vu khoi detail).
    var latestName = "";
    var latestDate = "";
    var latestEl = info.select(".flex.to100 a").first();
    if (latestEl !== null) latestName = cleanText(latestEl.text());
    var latestDateEl = info.select(".flex.to100 em.s_gray").first();
    if (latestDateEl !== null) latestDate = cleanText(latestDateEl.text());
    var totalText = cleanText(doc.select("#a_catalog span").text());
    var total = 0;
    var tm = totalText.match(/([\d,]+)\s*章/);
    if (tm) {
        total = parseInt(tm[1].replace(/,/g, ""), 10);
        if (isNaN(total)) total = 0;
    }

    var detailHtml = "";
    if (author) detailHtml += "作者：" + author + "<br>";
    if (statusText) detailHtml += "狀態：" + (ongoing ? "連載" : "完本") + "<br>";
    if (wordCount) detailHtml += "字數：" + wordCount + "<br>";
    if (genreText) detailHtml += "分類：" + genreText + "<br>";
    if (total > 0) detailHtml += "章節：" + total + "章<br>";
    if (latestName) {
        detailHtml += "最新章節：" + latestName;
        if (latestDate) detailHtml += "（" + latestDate + "）";
    }

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
