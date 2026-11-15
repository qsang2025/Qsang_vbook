// detail.js — Thong tin chi tiet mot truyen (execute(url)).
// URL mau: https://www.dingdian666.com/xiaoshuo/47418/ (天师神医,
// 抽刀断水, 都市言情, 连载中, 4990 chuong).
// Selector that (kiem chung live 2026-11-15): toan bo thong tin lay
// tu meta og:novel:* trong <head> (ten, tac gia, the loai, trang thai)
// + .border_left img lam bia (duong dan tuong doi) + .hang_3 gioi
// thieu + .hang_1 (loai/trang thai). Trang thai lay tu
// og:novel:status ("连载中" = dang ra, "已完结" = hoan thanh).
// The loai tren trang chi tiet -> input cua gen.js (khop genre.js).
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

// The loai tren trang chi tiet -> duong dan the loai cua gen.js.
var GENRE_INPUTS = {
    "玄幻魔法": "/sort/1_1/",
    "仙侠修真": "/sort/2_1/",
    "都市言情": "/sort/3_1/",
    "网游动漫": "/sort/4_1/",
    "科幻小说": "/sort/5_1/",
    "恐怖灵异": "/sort/6_1/",
    "历史军事": "/sort/7_1/",
    "其他小说": "/sort/8_1/",
    "全本小说": "/sort/9_1/"
};

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/xiaoshuo/" + id + "/";
    var r = fetchDdDoc(detailUrl);
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

    var cover = "";
    var img = safeFirst(doc.select(".border_left a img"));
    if (img !== null) cover = absUrl(img.attr("src") || "");

    var description = "";
    var intro = safeFirst(doc.select(".hang_3"));
    if (intro !== null) description = cleanText(intro.text());

    var detail = "Tác giả: " + author + "<br>Thể loại: " + category;
    if (status) detail = detail + "<br>Trạng thái: " + status;
    var h1el = safeFirst(doc.select(".hang_1"));
    if (h1el !== null) {
        var extra = cleanText(h1el.text());
        if (extra) detail = detail + "<br>" + extra;
    }

    var ongoing = true;
    if (status && status.indexOf("完") !== -1) ongoing = false;

    var genres = [];
    if (category && GENRE_INPUTS[category]) {
        genres.push({ title: category, input: GENRE_INPUTS[category], script: "gen.js" });
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
