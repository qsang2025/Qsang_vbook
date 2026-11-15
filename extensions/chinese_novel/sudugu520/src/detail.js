// detail.js — Chi tiet truyen (execute(url) -> doi tuong truyen).
//
// Trang truyen /<id>/ (kiem chung live 2026-11-15 voi /102/ 苟在两界修仙):
// - Ten: div.itemtxt h1 a; so chu: h1 i (vd "234.5万字").
// - Trang thai + the loai: div.itemtxt p span (vd "已完结", "仙侠小说").
// - Tac gia: a[href^="/zuozhe/"] ("作者：文抄公").
// - Anh bia: div.item img /files/cover/... (co that).
// - Mo ta: div.des p (ghep cac doan).
// - The loai (genres): doi ten the loai thanh duong dan /<the loai>/
//   qua bang GENRES trong file helper.js.
// - ongoing: false khi trang thai chua "已完结"/"完本"/"完结".
// LUU Y: meta description cua site ghi sai tac gia (vd "辰东创作的...")
// nen KHONG dung meta de lay tac gia.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = String(url || "");
    if (url.charAt(0) === "/") url = siteOrigin() + url;
    url = normalizeUrl(url);
    var r = fetchSgDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var titleEl = safeFirst(doc.select("div.itemtxt h1 a"));
    if (titleEl === null) return Response.error("Không đọc được tên truyện: " + url);
    var name = cleanText(titleEl.text());
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var imgEl = safeFirst(doc.select("div.item img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src")) || "";

    var words = "";
    var wordsEl = safeFirst(doc.select("div.itemtxt h1 i"));
    if (wordsEl !== null) words = cleanText(wordsEl.text());

    var status = "";
    var genreName = "";
    var spans = doc.select("div.itemtxt p span");
    if (spans.size() > 0) status = cleanText(spans.get(0).text());
    if (spans.size() > 1) genreName = cleanText(spans.get(1).text());

    var author = "";
    var authorEl = safeFirst(doc.select("div.itemtxt p a[href^=\"/zuozhe/\"]"));
    if (authorEl !== null) {
        author = cleanText(authorEl.text()).replace(/^作者：/, "");
    }

    var descParts = [];
    var descPs = doc.select("div.des p");
    var i = 0;
    for (i = 0; i < descPs.size(); i++) {
        var t = cleanText(descPs.get(i).text());
        if (t) descParts.push(t);
    }
    var description = descParts.join("\n");

    var ongoing = true;
    if (status.indexOf("已完结") !== -1 || status.indexOf("完本") !== -1 || status.indexOf("完结") !== -1) {
        ongoing = false;
    }

    var genres = [];
    if (genreName) {
        var gpath = genrePathByName(genreName);
        if (gpath) {
            genres.push({ title: genreName, input: gpath, script: "gen.js" });
        }
    }

    var detail = "";
    if (words) detail = words;
    if (status) detail = detail ? (detail + " · " + status) : status;

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url.replace(/\/+$/, ""),
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
