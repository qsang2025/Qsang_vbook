// detail.js — Thong tin chi tiet mot truyen (execute(url)).
// URL mau: https://m.douyinxs.com/bqg/223080/ (万族之劫,
// 老鹰吃小鸡, 都市, 连载, 966 chuong + chuong ket).
// Selector that (kiem chung live 2026-11-15): toan bo thong tin lay
// tu meta og:novel:* trong <head> (ten, tac gia, the loai, trang thai,
// chuong moi, anh bia og:image) + .review lam mo ta.
// Trang thai lay tu og:novel:status ("连载" = dang ra,
// "完结"/"已完结" = hoan thanh). The loai tren trang chi tiet ->
// input cua gen.js (khop genre.js).
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
    "玄奇": "/fenlei/1/1/",
    "高武": "/fenlei/2/1/",
    "修仙": "/fenlei/3/1/",
    "都市": "/fenlei/4/1/",
    "军事": "/fenlei/5/1/",
    "历史": "/fenlei/6/1/",
    "游体": "/fenlei/7/1/",
    "科幻": "/fenlei/8/1/",
    "恐怖": "/fenlei/9/1/",
    "次元": "/fenlei/10/1/",
    "女生": "/fenlei/11/1/"
};

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/bqg/" + id + "/";
    var r = fetchDyDoc(detailUrl);
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
    var latest = cleanText(doc.select('meta[property="og:novel:latest_chapter_name"]').attr("content"));
    var updateTime = cleanText(doc.select('meta[property="og:novel:update_time"]').attr("content"));

    var cover = absUrl(doc.select('meta[property="og:image"]').attr("content"));

    var description = "";
    var review = safeFirst(doc.select(".review"));
    if (review !== null) description = cleanText(review.text());

    var detail = "Tác giả: " + author + "<br>Thể loại: " + category;
    if (status) detail = detail + "<br>Trạng thái: " + status;
    if (latest) detail = detail + "<br>Mới nhất: " + latest;
    if (updateTime) detail = detail + "<br>Thời gian cập nhật: " + updateTime;

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
