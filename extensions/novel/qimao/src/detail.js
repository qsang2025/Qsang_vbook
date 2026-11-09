// detail.js — thong tin chi tiet mot truyen cua 七猫免费小说 (qimao.com).
// API chinh thuc cua app (khao sat 2026-11-09, da kiem chung live tu VM
// + tren may that — xem qimao-api.js):
//   GET https://api-bc.wtzw.com/api/v1/reader/detail?id=<bookid> (co ky)
//   data: {id, title, author, intro, image_link, words_num ("118万字"),
//   is_over ("1"/"0"), category1_name, category2_name, score,
//   latest_chapter_id, latest_chapter_title, characters, source_name}
// Vi du that: 10090611 错婚四十年，重生换嫁冷面军少被宠上天 — 商十一,
// 现代言情/年代重生, 9.3分, 已完结, moi nhat 第510章 双胞胎该喊小舅还是弟弟（完结篇）.
// Trang chi tiet web /shuku/<id>/ la Nuxt shell (chi co 1 link, moi du
// lieu nam trong __NUXT__ state) nen KHONG dung HTML lam nguon chinh;
// chi du phong bang <title> khi API loi (title dang
// "<ten>_(<tac gia>)小说最新章节...-七猫免费小说").
// Genres: the loai chi ghi vao dong detail (chua co API danh sach theo
// the loai de gan chip mo danh sach that) — kham pha the loai qua
// home.js / genre.js.
//
// Load: build se copy crypto.js (built-in), config.js, config-helpers.js,
// fetch-helpers.js, qimao-api.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('crypto.js');
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('qimao-api.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/shuku\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var json = qimaoApiGet(QIMAO_API_BC, "/api/v1/reader/detail", { id: bookId }, bookId);
    if (json) {
        var d = json.data || {};
        if (d.book) d = d.book;
        var name = d.title || d.book_name || "";
        if (name) {
            var author = d.author || d.author_name || "";
            var cover = d.image_link || d.thumb_url || d.big_image_link || "";
            if (cover) cover = absUrl(cover);
            var description = d.intro || d.abstract || "";
            description = cleanText(String(description).replace(/\\r\\n/g, " ").replace(/\r\n/g, " "));

            var ongoing = true;
            if (d.is_over === "1" || d.is_over === 1 || d.is_over === true) ongoing = false;
            var detailParts = [];
            if (d.words_num) detailParts.push(String(d.words_num));
            if (d.score) detailParts.push(String(d.score) + "分");
            var cats = [];
            if (d.category1_name) cats.push(d.category1_name);
            if (d.category2_name) cats.push(d.category2_name);
            if (cats.length > 0) detailParts.push(cats.join("/"));
            detailParts.push(ongoing ? "连载中" : "已完结");
            if (d.characters) detailParts.push("主角: " + String(d.characters));
            if (d.latest_chapter_title) detailParts.push("最新: " + d.latest_chapter_title);
            if (d.source_name) detailParts.push("来源: " + d.source_name);

            return Response.success({
                name: name,
                author: author,
                cover: cover,
                description: description,
                detail: detailParts.join(" · "),
                url: url,
                type: "novel",
                format: "novel",
                ongoing: ongoing,
                locale: "zh_CN",
                genres: []
            });
        }
    }

    // Du phong: HTML trang chi tiet (title tag chua ten + tac gia).
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được thông tin truyện (API lỗi và trang web không tải được): " + url);
    var titleText = cleanText(doc.select("title").text());
    var name2 = "";
    var author2 = "";
    var tm = titleText.match(/^(.+?)_\(([^)]+)\)/);
    if (tm) {
        name2 = cleanText(tm[1]);
        author2 = cleanText(tm[2]);
    } else {
        var idx = titleText.indexOf("免费阅读");
        if (idx > 0) name2 = cleanText(titleText.substring(0, idx));
        else name2 = titleText;
    }
    if (!name2) return Response.error("Không đọc được tên truyện: " + url);
    var cover2 = "";
    var coverEl = doc.select('img[src*="bookimg"]').first();
    if (coverEl !== null) {
        cover2 = coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover2.indexOf("default-book-cover") !== -1) cover2 = "";
        else if (cover2) cover2 = absUrl(cover2);
    }
    return Response.success({
        name: name2,
        author: author2,
        cover: cover2,
        description: "",
        detail: "",
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        locale: "zh_CN",
        genres: []
    });
}
