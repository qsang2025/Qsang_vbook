// detail.js — Chi tiet truyen Truyen Hay (truyenhay.com).
//
// Doc HTML trang bai viet. Ten truyen la ten series tach tu tieu de
// (vd "Tui phan 42" -> truyen "Tui phan", ky 42). Tac gia nam o doan
// dau bai ("Tac gia : X" hoac ten tac gia dung mot minh mot dong);
// mo ta lay doan van dau tien dai hon 60 ky tu (doan ngan dau bai
// thuong la ten tac gia, meta description cua site cung chi la doan
// dau bai nen khong dung duoc). The loai doc tu .entry-categories.
// execute(url).
//
// Load: file config.js, file rate-limit.js, file safe-first.js.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("truyenhay.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được truyện (HTTP " + response.status + ")");
    var doc = response.html();

    var heading = doc.select("article h1.entry-title").text();
    if (!heading) return Response.error("Không tìm thấy truyện");
    var info = parseTitle(heading);

    var content = safeFirst(doc.select("article div.entry-content[itemprop=text]"));
    var author = "";
    var description = "";
    if (content) {
        var paras = content.select("p");
        var i = 0;
        for (i = 0; i < paras.size(); i++) {
            var text = fixText(paras.get(i).text()).replace(/\s+/g, " ").trim();
            if (!text) continue;
            var m = /^Tác giả\s*:\s*(.+)$/.exec(text);
            if (m) {
                author = m[1].trim();
                continue;
            }
            if (!author && text.length < 40 && i === 0) {
                // Doan dau ngan dung mot minh (vd "Tran Linh") la ten tac gia.
                author = text;
                continue;
            }
            if (!description && text.length > 60) {
                description = text.substring(0, 200);
            }
            if (author && description) break;
        }
    }

    var genres = [];
    var catLinks = doc.select(".entry-categories a");
    var j = 0;
    for (j = 0; j < catLinks.size(); j++) {
        var a = catLinks.get(j);
        var slug = a.attr("href").replace(/\/+$/, "").split("/").pop();
        if (slug) genres.push({ title: a.text(), input: slug, script: "gen.js" });
    }

    var details = [];
    if (info.number) details.push("Kỳ đang xem: " + chapterName(info));
    details.push("Chuyên mục: " + doc.select(".entry-categories a").text());
    details.push("Ngày đăng: " + doc.select("time.entry-time").text());

    return Response.success({
        name: info.series,
        author: author,
        cover: doc.select("meta[property=og:image]").attr("content"),
        description: description,
        detail: details.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: info.number > 0,
        genres: genres,
        suggests: []
    });
}
