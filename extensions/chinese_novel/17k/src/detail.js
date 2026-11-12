// detail.js — chi tiet truyen 17k (/book/<id>.html).
// Ten: div.Info h1 a; tac gia: div.author a.name; bia: #bookCover img;
// mo ta: p.intro > a; trang thai: link dau tien trong div.label
// ("连载小说" = dang ra, "完本小说" = hoan thanh); cap nhat: dt.tit em.
// KHONG co search.js (xem search.js da xoa): tim kiem cua site bi WAF
// Alibaba chan ca tren VM lan may that, nen detail cung khong dua tag
// vao genres (tag chi tim duoc qua search).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url).replace("h5.17k.com", "www.17k.com");
    var fullUrl = BASE_URL + url;
    var response = fetchPage(fullUrl);
    if (!response || !response.ok) return Response.error("Không tải được trang truyện (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();

    var nameEl = safeFirst(doc.select("div.Info h1 a"));
    if (!nameEl) nameEl = safeFirst(doc.select("h1 a"));
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được tên truyện");

    var authorEl = safeFirst(doc.select("div.author a.name"));
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var coverEl = safeFirst(doc.select("#bookCover img"));
    var cover = coverEl ? coverEl.attr("src") : "";
    var descEl = safeFirst(doc.select("p.intro > a"));
    var description = descEl ? cleanText(descEl.text()) : "";

    var labelEl = safeFirst(doc.select("div.label a"));
    var labelText = labelEl ? cleanText(labelEl.text()) : "";
    var ongoing = labelText.indexOf("完本") === -1;
    var updateEl = safeFirst(doc.select("dt.tit em"));
    var updateText = updateEl ? cleanText(updateEl.text()) : "";

    var genres = [];
    // Tag o tr.label a KHONG dua vao genres: tag la tu khoa tu do, chi
    // tim duoc qua search.js — ma search.js da bo (xem ghi chu o cuoi
    // file): site search bi WAF chan ca tren VM lan may that.

    var detail = "作者：" + (author || "未知");
    if (labelText) detail += "<br>状态：" + labelText;
    if (updateText) detail += "<br>" + updateText;

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: fullUrl,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres,
        host: BASE_URL
    });
}
