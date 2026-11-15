// detail.js — Thong tin chi tiet mot truyen (execute(url)).
// URL mau: https://www.biqugezz.com/go/97746/ (紫狐归墟, 时渐晚,
// 玄幻, 连载中, 81 chuong).
// Selector that (kiem chung live 2026-11-15): toan bo thong tin lay
// tu meta og:novel:* trong <head> (ten, tac gia, the loai, trang thai,
// chuong moi, gio cap nhat) + og:image lam bia + og:description.
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

// The loai ngan trong og:novel:category -> duong dan the loai cua gen.js.
var GENRE_INPUTS = {
    "玄幻": "/xuanhuan.html",
    "仙侠": "/xianxia.html",
    "都市": "/dushi.html",
    "军史": "/junshi.html",
    "网游": "/wangyou.html",
    "科幻": "/kehuan.html",
    "灵异": "/lingyi.html",
    "言情": "/yanqing.html",
    "其他": "/qita.html"
};

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    // App cat dau "/" cuoi khoi URL arg khi chay that — khoi phuc lai.
    if (detailUrl.slice(-1) !== "/") detailUrl = detailUrl + "/";
    var r = fetchBqDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (!name) name = cleanText(doc.select("h1.booktitle").text());
    if (!name) return Response.error("Không đọc được tên truyện (site có thể đã đổi giao diện): " + detailUrl);
    var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
    var cover = doc.select('meta[property="og:image"]').attr("content") || "";
    var description = cleanText(doc.select('meta[property="og:description"]').attr("content"));
    var category = cleanText(doc.select('meta[property="og:novel:category"]').attr("content"));
    var status = cleanText(doc.select('meta[property="og:novel:status"]').attr("content"));
    var latest = cleanText(doc.select('meta[property="og:novel:latest_chapter_name"]').attr("content"));
    var updated = cleanText(doc.select('meta[property="og:novel:update_time"]').attr("content"));
    var detail = "Tác giả: " + author + "<br>Thể loại: " + category + "<br>Tình trạng: " + status + "<br>Mới nhất: " + latest + "<br>Thời gian cập nhật: " + updated;
    var ongoing = status.indexOf("完结") === -1 && status.indexOf("已完本") === -1;

    var genres = [];
    if (category && GENRE_INPUTS[category]) {
        genres.push({ title: category + "小说", input: GENRE_INPUTS[category], script: "gen.js" });
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
