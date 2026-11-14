// detail.js — chi tiet truyen cua Bqgoo (bqgooo.cc).
// URL nhan vao la link chi tiet chuan https://www.bqgooo.cc/shu/<id>/
// (link do search.js / book.js tra ve). Lay id roi goi API:
//   GET /api/book?id=<id>
// Tra ve {id,title,sortname,author,full,intro,lastchapterid,
// lastchapter,lastupdate,dirid}. Trang thai: full "完结" = hoan thanh
// (ongoing=false), "连载" = dang ra (ongoing=true).
// Bia theo cong thuc: COVER_HOST/bookimg/<floor(id/1000)>/<id>.jpg.
// The loai -> book.js voi input "sort:<key>".
// suggests de rong: API khong co muc truyen goi y.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// rate-limit.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var id = parseBookId(url);
    if (!id) return Response.error("URL truyện không hợp lệ: " + url);

    rateLimitDelay("apibi.cc");
    var j = fetchJsonWithFallback("/api/book?id=" + id);
    if (!j) return Response.error("Không tải được trang truyện: " + bookUrl(id));

    var name = cleanText(j.title || "");
    if (!name) return Response.error("Không nhận dạng được truyện: " + bookUrl(id));

    var author = cleanText(j.author || "");
    var category = cleanText(j.sortname || "");
    var description = cleanText(j.intro || "");
    var ongoing = true;
    if (cleanText(j.full || "") === "完结") ongoing = false;

    // The loai -> book.js.
    var genres = [];
    var sortKey = sortKeyForName(category);
    if (sortKey) {
        genres.push({
            title: category,
            input: "sort:" + sortKey,
            script: "book.js"
        });
    }

    // Dong chi tiet hien thi.
    var detail = "";
    if (author) detail = "作者：" + author;
    detail = detail + (detail ? " | " : "") + "状态：" + (ongoing ? "连载" : "完本");
    if (category) detail = detail + " | 类型：" + category;
    if (j.lastchapter) detail = detail + " | 最新：" + cleanText(j.lastchapter);
    if (j.lastupdate) detail = detail + " | 更新：" + cleanText(j.lastupdate);

    return Response.success({
        name: name,
        author: author,
        cover: coverUrl(id),
        description: description,
        detail: detail,
        url: bookUrl(id),
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
