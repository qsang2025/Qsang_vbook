// detail.js — chi tiet truyen: ten tu #novelMain h3 ("《寄生》简介" -> 寄生),
// tac gia tu .article_info_td h2, mo ta tu #novelMain pre, thong tin
// (tac gia / the loai / chuong moi nhat / cap nhat / tong so chu) tu .lb_fm,
// the loai tu link /wapsort/ trong .article_info_td.
// Kiem chung live 2026-11-16 (寄生 105011): ten 寄生， tac gia 桃红四物汤，
// mo ta 265 ky tu, the loai 玄幻奇幻， chuong moi nhat 第两百二十三章余温.
// Site khong co cover that nen cover de rong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchPoDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var heading = safeFirst(doc.select("#novelMain h3"));
    var name = heading === null ? "" : cleanText(heading.text());
    name = name.replace(/^《/, "").replace(/》简介$/, "");
    if (!name) {
        name = cleanText(doc.select("title").text()).replace(/_[^_]*_[^_]*$/, "");
    }
    if (!name) return Response.error("Không tìm thấy truyện");

    var author = cleanText(doc.select(".article_info_td h2").text());

    var intro = safeFirst(doc.select("#novelMain pre"));
    var description = intro === null ? "" : stripPromo(intro.text());
    if (!description) {
        description = doc.select("meta[name=description]").attr("content");
    }

    var detail = cleanText(doc.select(".lb_fm").text());

    var genres = [];
    var category = safeFirst(doc.select(".article_info_td a[href*=wapsort]"));
    if (category !== null) {
        var title = cleanText(category.text());
        var href = absUrl(category.attr("href"));
        if (title && href) genres.push({ title: title, input: href, script: "search.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: genres
    });
}

// Mot so mo ta kem dong quang cao cho mot site video khong lien quan.
function stripPromo(text) {
    var lines = String(text === undefined || text === null ? "" : text).split(/\n+/);
    var kept = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || /po18hub|激情视频请收藏/i.test(line)) continue;
        kept.push(line);
    }
    return kept.join("\n");
}
