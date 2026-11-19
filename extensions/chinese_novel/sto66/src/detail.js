// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua sto66.com (UTF-8):
//   Trang truyen: https://www.sto66.com/book/<id>.html
//     h1.booktitle                 ten truyen
//     .bookcover img.thumbnail     anh bia (img.cuoceng.com)
//     .booktag a.red               tac gia (link /search/<tac-gia>.html)
//     .booktag a.blue              the loai (link /library/<id>.html)
//     .booktag span.red            trang thai (全本 = hoan thanh)
//     .bookintro                   gioi thieu
//     .booktime                    thoi gian cap nhat
//   Muc luc nam o /chapter/<id>.html (page.js/toc.js suy ra tu id).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("sto66.com", 500, 1500);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = cleanText(doc.select("h1.booktitle").text());
    if (!name) return Response.error("Không đọc được tên truyện từ " + url);

    var coverEl = doc.select(".bookcover img").first();
    var cover = coverEl === null ? "" : String(coverEl.attr("src") || "");

    var author = "";
    var authorEl = doc.select(".booktag a.red").first();
    if (authorEl !== null) author = cleanText(authorEl.text());

    var statusText = "";
    var statusEl = doc.select(".booktag span.red").first();
    if (statusEl !== null) statusText = cleanText(statusEl.text());
    var ongoing = statusText.indexOf("全本") === -1;

    var genres = [];
    var seen = {};
    var genreSel = doc.select(".booktag a");
    var i = 0;
    for (i = 0; i < genreSel.size(); i++) {
        var el = genreSel.get(i);
        var href = String(el.attr("href") || "");
        var title = cleanText(el.text());
        if (!href || !title) continue;
        var input = absUrl(href);
        if (seen[input]) continue;
        seen[input] = true;
        genres.push({ title: title, input: input, script: "search.js" });
    }

    var descEl = doc.select(".bookintro").first();
    var description = descEl === null ? "" : String(descEl.html() || "");

    var detailParts = [];
    if (author) detailParts.push("作者：" + author);
    if (statusText) detailParts.push("状态：" + statusText);
    var timeText = cleanText(doc.select(".booktime").text());
    if (timeText) detailParts.push(timeText);
    detailParts.push("Nguồn: 思兔阅读");

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join("<br>"),
        url: url,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
