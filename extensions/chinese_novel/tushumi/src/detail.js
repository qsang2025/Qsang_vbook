// detail.js — Thong tin chi tiet mot truyen (execute(url)).
// URL mau: https://www.tushumi.cc/shu/105663/ (大奉打更人, 卖报小郎君,
// 武侠修真, 968 chuong duy nhat sau khi bo trung; chuong "完本感言"
// cho biet truyen da hoan thanh).
// Selector that (kiem chung live 2026-11-15): toan bo thong tin lay
// tu meta og:novel:* trong <head> (ten, tac gia, the loai) + og:image
// lam bia + og:description; #info h1/p + #fmimg img + #intro .introtxt
// lam fallback. The loai tren trang chi tiet -> input cua gen.js
// (khop genre.js). Trang KHONG co truong trang thai: ongoing suy ra
// tu chuong "完本感言" trong muc luc (truyen hoan thanh moi co chuong
// nay; truyen dang ra nhu 末世被算计 khong co) — heuristic, ghi ro o day.
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
    "玄幻魔法": "/leibie1_1.html",
    "武侠修真": "/leibie2_1.html",
    "都市言情": "/leibie3_1.html",
    "历史军事": "/leibie4_1.html",
    "侦探推理": "/leibie5_1.html",
    "网游动漫": "/leibie6_1.html",
    "科幻小说": "/leibie7_1.html",
    "恐怖灵异": "/leibie8_1.html",
    "散文诗词": "/leibie9_1.html",
    "其他类型": "/leibie10_1.html"
};

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/shu/" + id + "/";
    var r = fetchTmDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (!name) {
        var h1 = safeFirst(doc.select("#info h1"));
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) return Response.error("Không đọc được tên truyện (site có thể đã đổi giao diện): " + detailUrl);

    var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
    if (!author) {
        // #info p dau tien dang "作 者：卖报小郎君" (ten tac gia la text
        // thuong, KHONG nam trong <a> — base cu lay .select("a").text()
        // nen tra ve rong).
        var p0 = safeFirst(doc.select("#info p"));
        if (p0 !== null) author = cleanText(p0.text()).replace(/^.*?者：/, "");
    }

    var cover = doc.select('meta[property="og:image"]').attr("content") || "";
    if (!cover) {
        var img = safeFirst(doc.select("#fmimg img"));
        if (img !== null) cover = img.attr("src") || "";
    }

    var description = cleanText(doc.select('meta[property="og:description"]').attr("content"));
    if (!description) {
        var intro = safeFirst(doc.select("#intro .introtxt"));
        if (intro !== null) description = cleanText(intro.text());
    }

    var category = cleanText(doc.select('meta[property="og:novel:category"]').attr("content"));

    var ps = doc.select("#info p");
    var updated = ps.size() > 3 ? cleanText(ps.get(3).text()) : "";
    var latest = ps.size() > 4 ? cleanText(ps.get(4).text()) : "";
    var detail = "Tác giả: " + author + "<br>Thể loại: " + category;
    if (updated) detail = detail + "<br>" + updated;
    if (latest) detail = detail + "<br>" + latest;

    // Heuristic: truyen hoan thanh co chuong "完本感言" trong muc luc.
    var ongoing = true;
    try {
        if (doc.text().indexOf("完本感言") !== -1) ongoing = false;
    } catch (e) {}

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
