// detail.js — thong tin chi tiet mot truyen cua 小說狂人 (czbooks.net).
// Selector theo khao sat 2026-11-07 (HTML SSR thuan, UTF-8, ~332KB):
//   ten: div.info-wrap > div.info > h1.title (text gom ca 《》— strip)
//   tac gia: span.author > a (href //czbooks.net/a/{ten})
//   cover: div.thumbnail > img[src] (neu src chua default_no_thumbnail
//     thi coi nhu KHONG co cover — truyen mau s6pbed khong co cover that)
//   mo ta: div.info-wrap > div.description (HTML voi <br />)
//   bang trang thai: div.state > table, hang theo label:
//     連載狀態 (已完結/連載中), 收藏數, 觀看數, 更新時間,
//     分類 a#novel-category[href="//czbooks.net/c/{slug}"]
//   hashtag: ul.hashtag > li.item > a (chi lam tags, khong hien thi)
//   KHONG co truong so chuong rieng — so chuong = dem link TOC.
//   Age-gate overlay #__ageGate_overlay__ luon o trang thai hidden,
//   khong chan.
// Vi du: /n/s6pbed 《誰讓他修仙的！》 tac gia 最白的烏鴉, 已完結,
// 30537 收藏 / 3601386 观看, cap nhat 2025-03-24, the loai 武俠仙俠.
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
    var doc = fetchDocWithFallback(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var titleEl = doc.select("div.info-wrap div.info h1.title").first();
    if (titleEl === null) titleEl = doc.select("h1.title").first();
    if (titleEl === null) return Response.error("Không đọc được tên truyện: " + url);
    var name = cleanText(titleEl.text());
    // Ten gom ca 《》: 《誰讓他修仙的！》 -> 誰讓他修仙的！
    name = name.replace(/^《/, "").replace(/》$/, "");
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var author = "";
    var authorEl = doc.select("span.author a").first();
    if (authorEl !== null) author = cleanText(authorEl.text());
    if (!author) {
        var authorSpan = doc.select("span.author").first();
        if (authorSpan !== null) author = cleanText(authorSpan.text()).replace(/^作者:\s*/, "");
    }

    var cover = "";
    var img = doc.select("div.thumbnail img").first();
    if (img !== null) cover = coverFromImg(img);

    var descEl = doc.select("div.info-wrap div.description").first();
    var description = "";
    if (descEl !== null) description = descEl.html();

    // Bang trang thai: doc tung hang <tr>, td[0] la label, td[1] la gia tri.
    var statusText = "";
    var favCount = "";
    var viewCount = "";
    var updateTime = "";
    var genreText = "";
    var genreSlug = "";
    doc.select("div.state table tr").forEach(function (tr) {
        var tds = tr.select("td");
        if (tds.size() < 2) return;
        var label = cleanText(tds.get(0).text());
        var value = cleanText(tds.get(1).text());
        if (label === "連載狀態") statusText = value;
        else if (label === "收藏數") favCount = value;
        else if (label === "觀看數") viewCount = value;
        else if (label === "更新時間") updateTime = value;
        else if (label === "分類") {
            var catLink = tr.select("a#novel-category").first();
            if (catLink === null) catLink = tr.select("a").first();
            if (catLink !== null) {
                genreText = cleanText(catLink.text());
                var href = catLink.attr("href") || "";
                var m = href.match(/\/c\/([^\/\?]+)/);
                if (m) genreSlug = m[1];
            }
            if (!genreSlug && genreText) genreSlug = genreSlugByName(genreText);
        }
    });
    // Du phong trang thai: badge tren thumbnail (div.thumbnail-state).
    if (!statusText) {
        statusText = cleanText(doc.select("div.thumbnail-state").text());
    }
    var ongoing = statusText.indexOf("完結") === -1 && statusText.indexOf("完本") === -1;

    var genres = [];
    if (genreSlug) {
        genres.push({ title: genreText, input: "/c/" + genreSlug, script: "book.js" });
    }

    var detailHtml = "";
    if (author) detailHtml += "作者：" + author + "<br>";
    if (statusText) detailHtml += "連載狀態：" + statusText + "<br>";
    if (favCount) detailHtml += "收藏數：" + favCount + "<br>";
    if (viewCount) detailHtml += "觀看數：" + viewCount + "<br>";
    if (genreText) detailHtml += "分類：" + genreText + "<br>";
    if (updateTime) detailHtml += "更新時間：" + updateTime;

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
