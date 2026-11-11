// detail.js — chi tiet truyen cua 和图书 (hetushu.com).
// URL: https://www.hetushu.com/book/<id>/index.html
// (vd /book/10195/index.html — 剑来).
// Ten: .book_info h2. Tac gia / the loai / so chu: cac div trong
// .book_info bat dau bang 作者：/ 类型：/ 字数：. Cover: .book_info img
// (/book/cover.pic/cover_<id>.jpg). Mo ta: .book_info .intro.
// Trang thai: class cua .book_info — "finish" = hoan thanh
// (ongoing=false), "continue" = dang ra (ongoing=true).
// genres: the loai cua truyen -> book.js /book/index.php?type=<encoded>.
// detail: dong mo ta gom tac gia / trang thai / the loai / so chu /
// tong so chuong (dem link trong dl#dir — muc luc nam ngay tren trang
// chi tiet).
// suggests: cot phai co muc bang xep hang nhung HTML tinh de trong
// (nap bang JS) nen de rong.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");

    rateLimitDelay("www.hetushu.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    // Ten: h2 trong .book_info, fallback title trang.
    var name = cleanText(doc.select(".book_info h2").text());
    if (!name) {
        var pageTitle = cleanText(doc.select("title").text());
        if (pageTitle) name = pageTitle.split("免费在线阅读")[0];
    }
    if (!name) return Response.error("Không nhận dạng được trang truyện: " + url);

    // Quet cac div con cua .book_info theo tien to.
    var author = "";
    var category = "";
    var words = "";
    doc.select(".book_info > div").forEach(function (el) {
        var t = cleanText(el.text());
        if (!author && t.indexOf("作者：") === 0) {
            var aEl = safeFirst(el.select("a"));
            author = cleanText(aEl ? aEl.text() : t.substring(3));
        }
        if (!category && t.indexOf("类型：") === 0) category = t.substring(3);
        if (!words && t.indexOf("字数：") === 0) words = t.substring(3);
    });

    // Cover: img trong .book_info.
    var cover = coverFromImg(doc.select(".book_info img").first());

    // Mo ta: .intro trong .book_info (cac <p> da duoc cleanText gop).
    var description = cleanText(doc.select(".book_info .intro").text());

    // Trang thai tu class cua .book_info.
    var infoClass = doc.select(".book_info").first();
    var cls = infoClass === null ? "" : infoClass.attr("class");
    var ongoing = true;
    if (cls.indexOf("finish") !== -1) ongoing = false;

    // Tong so chuong (muc luc nam ngay tren trang chi tiet).
    var chapterCount = doc.select("dl#dir dd a").size();

    // The loai -> book.js.
    var genres = [];
    if (category) {
        genres.push({
            title: category,
            input: "/book/index.php?type=" + encodeURIComponent(category),
            script: "book.js"
        });
    }

    // Dong chi tiet hien thi.
    var detail = "";
    if (author) detail = "作者：" + author;
    detail = detail + (detail ? " | " : "") + "状态：" + (ongoing ? "连载" : "完本");
    if (category) detail = detail + " | 类型：" + category;
    if (words) detail = detail + " | 字数：" + words;
    if (chapterCount > 0) detail = detail + " | 共 " + chapterCount + " 章";

    return Response.success({
        name: htmlDecode(name),
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
