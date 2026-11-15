// detail.js — Thong tin chi tiet mot truyen (execute(url)).
// URL mau: https://www.22mt.net/juejingheiye/ (绝境黑夜, 滚开,
// 修真小说, 完本, 624 chuong).
// Selector that (kiem chung live 2026-11-15): toan bo thong tin lay
// tu meta og:novel:* trong <head> (ten, tac gia, the loai, trang thai,
// ngay cap nhat, chuong moi nhat, mo ta, anh bia) + h1 ten +
// .book_info img bia (duong dan tuong doi) + #intro_pc gioi thieu
// (fallback khi og:description trong). Trang thai lay tu
// og:novel:status ("完本" = hoan thanh, "连载" = dang ra).
// The loai tren trang chi tiet -> input cua gen.js (khop genre.js:
// ten THAT tu <title> trang /list/N.html).
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

// The loai tren trang chi tiet (og:novel:category) -> duong dan
// the loai cua gen.js. Ten lay tu <title> moi trang /list/N.html.
var GENRE_INPUTS = {
    "玄幻小说": "/list/1.html",
    "玄幻": "/list/1.html",
    "修真小说": "/list/2.html",
    "修真": "/list/2.html",
    "都市小说": "/list/3.html",
    "都市": "/list/3.html",
    "历史小说": "/list/4.html",
    "历史": "/list/4.html",
    "网游小说": "/list/5.html",
    "网游": "/list/5.html",
    "科幻小说": "/list/6.html",
    "科幻": "/list/6.html",
    "言情小说": "/list/7.html",
    "言情": "/list/7.html",
    "其它小说": "/list/8.html",
    "其它": "/list/8.html",
    "其他小说": "/list/8.html",
    "其他": "/list/8.html"
};

function execute(url) {
    var slug = bookSlug(url);
    if (!slug) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = detailUrlOf(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    var r = fetchMtDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (!name) {
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) return Response.error("Không đọc được tên truyện (site có thể đã đổi giao diện): " + detailUrl);

    var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
    var category = cleanText(doc.select('meta[property="og:novel:category"]').attr("content"));
    var status = cleanText(doc.select('meta[property="og:novel:status"]').attr("content"));
    var updateTime = cleanText(doc.select('meta[property="og:novel:update_time"]').attr("content"));
    var latestChap = cleanText(doc.select('meta[property="og:novel:latest_chapter_name"]').attr("content"));

    var cover = cleanText(doc.select('meta[property="og:image"]').attr("content"));
    if (cover.indexOf("//") === 0) cover = "https:" + cover;
    else if (cover) cover = absUrl(cover);
    if (!cover) {
        var img = safeFirst(doc.select(".book_info img"));
        if (img !== null) cover = absUrl(img.attr("src") || "");
    }

    var description = cleanText(doc.select('meta[property="og:description"]').attr("content"));
    if (!description) {
        var intro = safeFirst(doc.select("#intro_pc"));
        if (intro !== null) {
            description = cleanText(intro.text()).replace(/^简介[：:]\s*/, "");
            var cut = description.indexOf("您要是觉得");
            if (cut !== -1) description = description.substring(0, cut).replace(/\s+$/g, "");
        }
    }

    var detail = "Tác giả: " + author + "<br>Thể loại: " + category;
    if (status) detail = detail + "<br>Trạng thái: " + status;
    if (latestChap) detail = detail + "<br>Mới nhất: " + latestChap;
    if (updateTime) detail = detail + "<br>Thời gian cập nhật: " + updateTime;

    var ongoing = true;
    if (status && status.indexOf("完") !== -1) ongoing = false;

    var genres = [];
    if (category && GENRE_INPUTS[category]) {
        var shortName = category.replace(/小说$/, "");
        genres.push({ title: shortName, input: GENRE_INPUTS[category], script: "gen.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: detailUrl,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres
    });
}
